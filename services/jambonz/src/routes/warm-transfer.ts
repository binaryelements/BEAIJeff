import { parseDestination } from '../utils/api-client';
import apiClient from '../utils/api-client';

const transferDescription = `When transferring the call to a specialist, 
FIRST inform them that you are transferring them to a specialist, 
and ONLY THEN, after you finish speaking, invoke the transfer_call_to_agent tool.
Do not say anything else after invoking the tool.`;

const summaryDescription = `
  A brief summary of the conversation.
  The summary should be no more than 100 words. If the caller provided their name, include it in the summary.
  Highlight their interests and needs as well as any specific concerns they may have stated. If they 
  are interested in a specific product or service, include that in the summary. Do not speak the summary`;

// AI-powered warm transfer with OpenAI
const sessions: Record<string, any> = {};

export const createWarmTransferService = ({ logger, makeService }: any) => {
  const svc = makeService({ path: '/warm-transfer' });

  svc.on('session:new', async (session: any) => {
    sessions[session.call_sid] = session;
    const { from, to, direction } = session;
    
    // Fetch phone number configuration for voice settings
    let phoneConfig: any = null;
    const calledNumber = session.to || session.called_number;
    
    try {
      const response = await apiClient.getPhoneNumberConfig(calledNumber);
      phoneConfig = response;
      logger.info(`Phone config loaded for ${calledNumber}`, phoneConfig);
    } catch (error) {
      logger.error(`Failed to fetch phone config for ${calledNumber}:`, error);
      // Use default configuration if phone number not found
      phoneConfig = {
        phoneNumber: calledNumber,
        metadata: {
          voiceSettings: {
            voice: "alloy",
            temperature: 0.8
          }
        }
      };
    }
    
    session.locals = { 
      logger: logger.child({ call_sid: session.call_sid }),
      transferTrunk: process.env.TRANSFER_TRUNK,
      transferNumber: '8811001', // Fixed number as requested
      callerId: process.env.CALLER_ID || session.from,
      phoneConfig
    };
    
    logger.info({ from, to, direction, session }, `new incoming call: ${session.call_sid}`);

    // Keep WebSocket alive with ping every 25 seconds
    session.locals.keepAlive = setInterval(() => {
      if (session.ws) {
        session.ws.ping();
      }
    }, 25000);

    const apiKey = process.env.OPENAI_API_KEY;
    const prompt = `You are a friendly receptionist for Binary Elements. Help callers with their inquiries and transfer them to specialists when needed.\n\n${transferDescription}`;

    session
      .on('/event', onEvent.bind(null, session))
      .on('/final', onFinal.bind(null, session))
      .on('close', onClose.bind(null, session))
      .on('error', onError.bind(null, session))
      .on('/toolCall', onToolCall.bind(null, session))
      .on('/consultationDone', onConsultationDone.bind(null, session));

    if (!apiKey) {
      session.locals.logger.warn('missing OPENAI_API_KEY, hanging up');
      session
        .hangup()
        .send();
    } else {
      try {
        session
          .answer()
          .pause({ length: 1 })
          .llm({
            vendor: 'openai',
            model: 'gpt-4o-realtime-preview-2025-06-03',
            auth: {
              apiKey
            },
            actionHook: '/final',
            eventHook: '/event',
            toolHook: '/toolCall',
            events: [
              'conversation.item.*',
              'response.audio_transcript.done',
              'input_audio_buffer.committed'
            ],
            llmOptions: {
              response_create: {
                modalities: ['text', 'audio'],
                instructions: prompt,
                voice: session.locals.phoneConfig?.metadata?.voiceSettings?.voice || 'alloy',
                output_audio_format: 'pcm16',
                temperature: 0.8,
                max_output_tokens: 4096,
              },
              session_update: {
                tools: [
                  {
                    name: 'transfer_call_to_agent',
                    type: 'function',
                    description: 'Transfers the call to a specialist',
                    parameters: {
                      type: 'object',
                      properties: {
                        conversation_summary: {
                          type: 'string',
                          description: summaryDescription
                        }
                      },
                      required: ['conversation_summary']
                    }
                  }
                ],
                tool_choice: 'auto',
                input_audio_transcription: {
                  model: 'whisper-1'
                },
                turn_detection: {
                  type: 'server_vad',
                  threshold: 0.8,
                  prefix_padding_ms: 600,
                  silence_duration_ms: 1100
                }
              }
            }
          })
          .hangup()
          .send();
      } catch (err) {
        session.locals.logger.error({ err }, `Error responding to incoming call: ${session.call_sid}`);
        session.close();
      }
    }
  });
};

const onEvent = async (session: any, evt: any) => {
  const { logger } = session.locals;
  logger.info(`got eventHook: ${JSON.stringify(evt)}`);
};

const onFinal = async (session: any, evt: any) => {
  const { logger } = session.locals;
  logger.info(`got actionHook: ${JSON.stringify(evt)}`);

  if (['server failure', 'server error'].includes(evt.completion_reason)) {
    if (evt.error?.code === 'rate_limit_exceeded') {
      let text = 'Sorry, you have exceeded your OpenAI rate limits. ';
      const arr = /try again in (\d+)/.exec(evt.error.message);
      if (arr) {
        text += `Please try again in ${arr[1]} seconds.`;
      }
      session
        .say({ text });
    } else {
      session
        .say({ text: 'Sorry, there was an error processing your request.' });
    }
    session.hangup();
  }
  session.reply();
};

const onToolCall = async (session: any, evt: any) => {
  const { logger, callerId, transferTrunk, transferNumber } = session.locals;
  const { name, args, tool_call_id } = evt;
  const { conversation_summary } = args;
  logger.info({ evt }, `got toolHook for ${name} with tool_call_id ${tool_call_id}`);

  session.locals.conversation_summary = conversation_summary;

  try {
    const data = {
      type: 'client_tool_result',
      invocation_id: tool_call_id,
      result: 'Successfully initiated transfer to specialist.',
    };
    session.sendToolOutput(tool_call_id, data);

    // Queue the caller
    session
      .say({ text: 'Please hold while we connect you to a specialist.' })
      .enqueue({
        name: session.call_sid,
        actionHook: '/consultationDone'
      })
      .send();

    // Dial the specialist using sendCommand like in the example
    const to = parseDestination(transferNumber, transferTrunk);
    session.sendCommand('dial', {
      call_hook: '/dial-specialist',
      from: callerId || session.from,
      to,
      tag: {
        conversation_summary,
        queue: session.call_sid
      }
    });

  } catch (err) {
    logger.error({ err }, 'error transferring call');
    const data = {
      type: 'client_tool_result',
      invocation_id: tool_call_id,
      error_message: 'Failed to transfer call'
    };
    session.sendToolOutput(tool_call_id, data);
  }
};

const onConsultationDone = (session: any, evt: any) => {
  const { logger } = session.locals;
  logger.info({ evt }, 'consultation done');
  // Handle consultation completion
};

const onClose = (session: any, code: any, reason: any) => {
  delete sessions[session.call_sid];
  const { logger, keepAlive } = session.locals;
  if (keepAlive) {
    clearInterval(keepAlive);
  }
  logger.info({ code, reason }, `session ${session.call_sid} closed`);
};

const onError = (session: any, err: any) => {
  const { logger } = session.locals;
  logger.error({ err }, `session ${session.call_sid} received error`);
};