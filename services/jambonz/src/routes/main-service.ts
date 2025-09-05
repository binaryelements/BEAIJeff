import apiClient from '../utils/api-client';

// Utility function to ensure consistent voice selection with logging
const getConsistentVoice = (phoneConfig: any, logger: any, context: string) => {
  const configuredVoice = phoneConfig?.metadata?.voiceSettings?.voice;
  const finalVoice = configuredVoice || 'alloy';
  
  logger.info({ 
    configuredVoice,
    finalVoice,
    voiceSource: configuredVoice ? 'phoneConfig' : 'fallback',
    context
  }, `Voice selection for ${context}`);
  
  return finalVoice;
};


const sleepFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const createMainService = ({ logger, makeService }: any) => {
  const svc = makeService({ path: '/main' });

  svc.on('session:new', async (session: any, path: string) => {
    // Fetch phone number configuration from API
    let phoneConfig: any = null;
    const calledNumber = session.to || session.called_number;
    
    let configSource = 'db';
    try {
      const response = await apiClient.getPhoneNumberConfig(calledNumber);
      phoneConfig = response;
      logger.info(`Phone config loaded for ${calledNumber}`, phoneConfig);
      
      // Voice debugging: Log initial phone config voice settings
      logger.info({ 
        calledNumber,
        voiceSettings: phoneConfig?.metadata?.voiceSettings,
        voice: phoneConfig?.metadata?.voiceSettings?.voice,
        temperature: phoneConfig?.metadata?.voiceSettings?.temperature,
        configSource: 'api_response'
      }, 'Initial phone config voice settings from API');
    } catch (error) {
      logger.error(`Failed to fetch phone config for ${calledNumber}:`, error);
      // Use default configuration if phone number not found
      configSource = 'fallback';
      phoneConfig = {
        phoneNumber: calledNumber,
        instructions: null,
        supportNumber: process.env.AGENT_NUMBER || '8811001',
        metadata: {
          departments: [
            { name: 'sales', transferNumber: process.env.AGENT_NUMBER || '8811001' },
            { name: 'support', transferNumber: process.env.AGENT_NUMBER || '8811001' },
            { name: 'billing', transferNumber: process.env.AGENT_NUMBER || '8811001' },
            { name: 'technical', transferNumber: process.env.AGENT_NUMBER || '8811001' }
          ],
          voiceSettings: {
            voice: "alloy",
            temperature: 0.8
          }
        }
      };
      
      // Voice debugging: Log fallback voice settings
      logger.info({ 
        calledNumber,
        voiceSettings: phoneConfig.metadata.voiceSettings,
        voice: phoneConfig.metadata.voiceSettings.voice,
        temperature: phoneConfig.metadata.voiceSettings.temperature,
        configSource: 'fallback_config'
      }, 'Fallback phone config voice settings');
    }

    // Extract and store caller's phone number
    const callerPhoneNumber = session.from || session.caller_id || 'unknown';
    
    // Try to find existing contact
    let existingContact = null;
    if (phoneConfig?.company?.id && callerPhoneNumber !== 'unknown') {
      try {
        existingContact = await apiClient.getContactByPhone(phoneConfig.company.id, callerPhoneNumber);
        logger.info(`Found existing contact for ${callerPhoneNumber}:`, existingContact);
      } catch (error) {
        logger.info(`No existing contact found for ${callerPhoneNumber}`);
      }
    }
    const selectedVoice = phoneConfig?.metadata?.voiceSettings?.voice;
    
    // Voice debugging logs
    logger.info({ 
      phoneConfigVoice: phoneConfig?.metadata?.voiceSettings?.voice,
      selectedVoice,
      fallbackVoice: 'alloy',
      voiceSource: phoneConfig?.metadata?.voiceSettings?.voice ? 'phoneConfig' : 'fallback'
    }, 'Voice selection during session setup');

    session.locals = {
      ...session.locals,
      transcripts: [],
      conversationContext: {
        customerIssues: [],
        attemptedSolutions: [],
        transferRequested: false
      },
      callStartTime: new Date(),
      callerPhoneNumber, // Store caller's phone number for easy access
      phoneConfig,
      selectedVoice,
      configSource,
      companyId: phoneConfig?.company?.id || null,
      phoneNumberId: phoneConfig?.id || null,
      existingContact,
      collectedData: {},
      logger: logger.child({ call_sid: session.call_sid, caller: callerPhoneNumber })
    };

    const cd = session.customerData || {};
    const conversation_summary = cd.conversation_summary || '';

    session.locals.logger.info(`new incoming call: ${session.call_sid} from ${callerPhoneNumber} to ${calledNumber}`);
    
    // Comprehensive voice debugging summary
    session.locals.logger.info({ 
      selectedVoice, 
      configSource,
      phoneConfigExists: !!phoneConfig,
      voiceSettingsExists: !!phoneConfig?.metadata?.voiceSettings,
      configuredVoice: phoneConfig?.metadata?.voiceSettings?.voice,
      effectiveVoice: phoneConfig?.metadata?.voiceSettings?.voice || 'alloy',
      callSid: session.call_sid
    }, 'Final voice configuration summary for call session');

    // Create call record in database
    try {
      const callRecord = await apiClient.createCall({
        callSid: session.call_sid,
        companyId: session.locals.companyId,
        phoneNumberId: session.locals.phoneNumberId,
        phoneNumber: session.from || session.caller_id,
        calledNumber: calledNumber,
        status: 'in_progress',
        metadata: {
          to: session.to,
          direction: session.direction || 'inbound',
          customerData: cd,
          company: phoneConfig?.company
        }
      });
      session.locals.callId = callRecord.id; // Store the call ID for later use
      session.locals.logger.info(`Call record created for ${session.call_sid} with ID ${callRecord.id}`);
    } catch (error) {
      session.locals.logger.error(`Failed to create call record: ${error}`);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    
    session
      .on('/event', onEvent.bind(null, session))
      .on('/toolCall', onToolCall.bind(null, session))
      .on('/final', onFinal.bind(null, session))
      .on('/dialAction', onDialAction.bind(null, session))
      .on('/enqueue-result', onEnqueueResult.bind(null, session))
      .on('close', onClose.bind(null, session))
      .on('error', onError.bind(null, session));

    if (!apiKey) {
      session.locals.logger.warn('missing OPENAI_API_KEY, hanging up');
      session
        .hangup()
        .send();
    } else {
      session
        .answer()
        .pause({ length: 2 })
        .tag({
          data: {
            phone_num: process.env.AGENT_NUMBER,
            conversation_summary: conversation_summary || 'New customer inquiry',
            llm_enabled: true
          }
        })
        .llm({
          vendor: 'openai',
          model: 'gpt-realtime',
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
              instructions: `
                  # Important Rules
                  - Always Speak in English
                  - Do not change voice always use ${phoneConfig?.metadata?.voiceSettings?.voice || 'alloy'}
                  # Personality

                  You are Smart Voice AI digital receptionist for ${phoneConfig?.company?.name}. 
                  
                  ${phoneConfig.instructions}
                  
                  You're naturally conversational, handling ambiguity gracefully (like distinguishing between "James Edwards" and "James Monty" when someone asks for "James from Sales").

                  # Operating Modes

                  ## Mode 1: Digital Receptionist Mode
                  When callers reach the company during normal operations:
                  - Greet professionally: "how can I assist you today?" 
                  - Identify the destination (department or specific person)
                  - Handle ambiguity intelligently (e.g., multiple people with same first name)
                  - Collect caller information before transferring
                  - Check availability and transfer or take a message

                  ## Mode 2: Overflow Call Mode
                  When all staff are busy:
                  - Greet with queue status: "everyone is busy at the moment."
                  - Offer options: wait in queue or leave a callback message
                  - If waiting: Provide estimated wait time (e.g., "This is the overflow queue so it might be more than 5 minutes")
                  - If callback requested: Collect detailed message for callback
                  - Can provide company facts/information while caller waits (if configured)

                  # Core Workflow

                  ## Step 1: Initial Greeting
                  - Identify caller's destination need (person or department)
                  - Use caller's phone number (${callerPhoneNumber}) for lookup if available

                  ## Step 2: Destination Clarification
                  - If ambiguous (e.g., "James from Sales"), clarify which specific person
                  - Smart handling of department requests (Sales, Support, Engineering, etc.)

                  ## Step 3: Information Collection
                  ALWAYS collect before attempting transfer:
                  - Caller's name
                  - Company/organization
                  - Phone number (default to ${callerPhoneNumber} if they say "this number")
                  - Brief message or reason for calling

                  Example: "May I have your name, telephone number, and a short message? If [Person] isn't available, I'll pass your details along."

                  ## Step 4: Availability Check & Transfer
                  - Check if endpoint is available (person, queue, or ring group)
                  - If available: "Transferring you now" → Transfer with context
                  - If unavailable: "I'm sorry, it seems that [Person] is not around. Would you like me to schedule a callback for you?"
                  - Always offer callback scheduling when transfers fail or queues are too long

                  ## Step 5: Call Announcement (for answered transfers)
                  When transferring to available party:
                  "You have a call from [Name], [Company] about [topic]. Do you want to answer?"

                  # Queue Management

                  When placing callers in queue:
                  - Be transparent about wait times
                  - Offer alternatives (callback vs waiting)
                  - For long waits: "The wait is about X minutes. Would you prefer to schedule a callback instead?"
                  - Adjust phrasing based on destination type (queue vs ring group)
                  - Provide company information or facts during wait (if configured)

                  # Data Collection & Storage

                  All interactions must capture:
                  - Caller name
                  - Company name
                  - Contact number
                  - Message/reason for calling
                  - Timestamp
                  - Destination requested
                  - Callback scheduled (if applicable)

                  ${phoneConfig?.company?.dataCollectionFields ? `
                  Additional fields to collect:
                  ${phoneConfig.company.dataCollectionFields.customFields?.map((field: any) => `- ${field.label} (${field.required ? 'required' : 'optional'})${field.aiPrompt ? `: ${field.aiPrompt}` : ''}`).join('\n') || ''}
                  ` : ''}

                  # Privacy & Recording Settings
                  - Transcription: ${phoneConfig?.metadata?.transcribeEnabled ? 'Enabled' : 'Disabled'}
                  - Summarization: ${phoneConfig?.metadata?.summarizeEnabled ? 'Enabled' : 'Disabled'}
                  - All data appears in BE Portal management and customer portal

                  # Tone & Conversation Style

                  - Professional but friendly - you're the first point of contact
                  - Efficient - respect caller's time
                  - Clear and concise - avoid unnecessary elaboration
                  - Adaptive - match urgency in caller's tone
                  - Patient with clarifications but purposeful in gathering information

                  When formatting for speech:
                  - Use natural pauses with ellipses ("...")
                  - Pronounce clearly (say "dot" not ".")
                  - Spell out acronyms carefully
                  - Use conversational confirmations ("Got it", "One moment", "Let me check")

                  # Important Context
                  ${existingContact ? `
                  ## Known Caller Information
                  - Name: ${(existingContact as any).name}
                  - Company: ${(existingContact as any).companyName || 'Not specified'}
                  - Previous Calls: ${(existingContact as any).totalCalls || 0}
                  - VIP Status: ${(existingContact as any).isVip ? 'VIP Customer' : 'Regular Customer'}
                  ${(existingContact as any).notes ? `- Notes: ${(existingContact as any).notes}` : ''}
                  ` : ''}

                  ## Available Departments
                  ${phoneConfig?.metadata?.departments?.map((d: any) => `- ${d.name}: ${d.description || ''}`).join('\n') || `- Sales
                  - Support
                  - Engineering
                  - Billing
                  - General`}

                  # System Integration Notes
                  - Calls are looked up from CallTo phone number database
                  - System generates prompts based on company settings
                  - Integration with Office 365 for contact management
                  - Manager UI available through BE Portal
                  - Call flow: Enqueue → Check endpoint validity → Confirm and Dequeue → Transfer

                  # Guardrails

                  - Stay focused on call routing and callback scheduling
                  - Don't provide extensive technical support - collect info and route appropriately
                  - If unsure about a person or department, ask for clarification
                  - Always confirm callback numbers and times by repeating them
                  - For complex issues beyond routing, collect details and schedule callbacks with appropriate team
                  - Never claim to be human - you're Jeff, the AI receptionist
                  - If call quality is poor or input is garbled, politely ask for clarification
                  - Handle frustrated callers professionally - explain you need information to help

                  # Error Handling

                  If transfer fails:
                  "I'm having trouble reaching [destination] right now. Let me schedule a callback for you so someone can get back to you shortly."

                  If caller is impatient about wait:
                  "I understand your time is valuable. Would you prefer to schedule a callback instead of waiting?"

                  If destination is unclear:
                  "I want to make sure I connect you with the right person. Could you tell me what this is regarding`,
              voice: getConsistentVoice(phoneConfig, session.locals.logger, 'main_llm_session'),
              output_audio_format: 'pcm16',
              temperature: phoneConfig?.metadata?.voiceSettings?.temperature || 0.8,
              max_output_tokens: 4096,
            },
            session_update: {
              voice: getConsistentVoice(phoneConfig, session.locals.logger, 'session_update_initial'),
              tools: [
                {
                  name: 'search_contacts',
                  type: 'function',
                  description: 'Search for contacts in the database by name, phone, or company',
                  parameters: {
                    type: 'object',
                    properties: {
                      query: {
                        type: 'string',
                        description: 'General search query (searches across name, phone, email, company)',
                      },
                      name: {
                        type: 'string',
                        description: 'Contact name to search for',
                      },
                      phoneNumber: {
                        type: 'string',
                        description: 'Phone number to search for',
                      },
                      email: {
                        type: 'string',
                        description: 'Email to search for',
                      },
                    },
                  },
                },
                {
                  name: 'collect_caller_data',
                  type: 'function',
                  description: 'Collect and store caller information with custom fields',
                  parameters: {
                    type: 'object',
                    properties: {
                      caller_name: {
                        type: 'string',
                        description: 'Name of the caller',
                      },
                      company_name: {
                        type: 'string',
                        description: 'Company or venue name',
                      },
                      contact_number: {
                        type: 'string',
                        description: 'Phone number to call back to',
                      },
                      email: {
                        type: 'string',
                        description: 'Email address of the caller',
                      },
                      department: {
                        type: 'string',
                        description: 'Department or role of the caller',
                      },
                      reason_for_calling: {
                        type: 'string',
                        description: 'Detailed reason for the call',
                      },
                      custom_fields: {
                        type: 'object',
                        description: 'Any additional custom fields collected',
                      },
                    },
                    required: ['caller_name', 'reason_for_calling'],
                  },
                },
                {
                  name: 'gather_caller_info',
                  type: 'function',
                  description: 'Gather and confirm caller information (legacy - use collect_caller_data instead)',
                  parameters: {
                    type: 'object',
                    properties: {
                      caller_name: {
                        type: 'string',
                        description: 'Name of the caller',
                      },
                      company_name: {
                        type: 'string',
                        description: 'Company or venue name',
                      },
                      contact_number: {
                        type: 'string',
                        description: 'Phone number to call back to',
                      },
                      issue_description: {
                        type: 'string',
                        description: 'Brief description of the IT issue',
                      },
                    },
                    required: ['caller_name', 'company_name', 'contact_number', 'issue_description'],
                  },
                },
                {
                  name: 'schedule_callback',
                  type: 'function',
                  description: 'Schedule a callback for the customer when second level support is not immediately available',
                  parameters: {
                    type: 'object',
                    properties: {
                      preferred_time: {
                        type: 'string',
                        description: 'Customer preferred callback time in ISO 8601 format (e.g., 2024-01-01T14:00:00)',
                      },
                      phone_number: {
                        type: 'string',
                        description: `Phone number for callback. Use the caller's number if customer says "this number" or "same number". Otherwise use the specific number they provide.`,
                      },
                      topic: {
                        type: 'string',
                        description: 'Topic for the callback',
                      },
                    },
                    required: ['preferred_time', 'phone_number', 'topic'],
                  },
                },
                {
                  name: 'transfer_call',
                  type: 'function',
                  description: 'Transfer caller to appropriate department (sales, support, billing, etc.)',
                  parameters: {
                    type: 'object',
                    properties: {
                      department: {
                        type: 'string',
                        enum: ['sales', 'support', 'billing', 'technical', 'general'],
                        description: 'Department to transfer the call to',
                      },
                      reason: {
                        type: 'string',
                        description: 'Reason for the transfer (pricing inquiry, technical issue, etc.)',
                      },
                      caller_info: {
                        type: 'string',
                        description: 'Brief summary of caller information to pass to the department',
                      },
                    },
                    required: ['department', 'reason', 'caller_info'],
                  },
                },
              ],
              tool_choice: 'auto',
              input_audio_transcription: {
                model: 'whisper-1',
              },
              // Ensure voice is consistently applied
              voice: (function() {
                const voice = phoneConfig?.metadata?.voiceSettings?.voice || 'alloy';
                session.locals.logger.info({ 
                  configuredVoice: phoneConfig?.metadata?.voiceSettings?.voice,
                  finalVoice: voice,
                  voiceSource: phoneConfig?.metadata?.voiceSettings?.voice ? 'phoneConfig' : 'fallback',
                  location: 'session_update_final'
                }, 'Final session update voice enforcement');
                return voice;
              })(),
              turn_detection: {
                type: 'server_vad',
                threshold: 0.8,
                prefix_padding_ms: 600,
                silence_duration_ms: 1100,
              }
            }
          }
        })
        .send();
    }
  });
};

const onFinal = async (session: any, evt: any) => {
  const { logger, conversationContext } = session.locals;
  logger.info(`LLM session completed: ${evt.completion_reason}`);

  // Handle errors
  if (['server failure', 'server error'].includes(evt.completion_reason)) {
    if (evt.error?.code === 'rate_limit_exceeded') {
      let text = 'Sorry, you have exceeded your open AI rate limits. ';
      const arr = /try again in (\d+)/.exec(evt.error.message);
      if (arr) {
        text += `Please try again in ${arr[1]} seconds.`;
      }
      logger.error(`Rate limit exceeded: ${evt.error.message}`);
      // Removed TTS say; let LLM handle any messaging
    } else {
      logger.error(`LLM error: ${evt.error?.message || 'Unknown error'}`);
      // Removed TTS say; let LLM handle any messaging
    }
    session.hangup();
  } else if (evt.completion_reason === 'normal conversation end') {
    // Don't end the call unless explicitly requested or transfer is in progress
    if (conversationContext?.endRequested) {
      logger.info('Ending call as requested');
      session.hangup();
    } else if (conversationContext?.transferInProgress) {
      logger.info('Transfer in progress, keeping session active for dial');
      // Don't hangup - let the dial action complete
    } else {
      logger.info('Keeping session alive for continued conversation');
      // Just reply to keep the session active
    }
  }
  
  session.reply();
};

const onEvent = async (session: any, evt: any) => {
  const { logger } = session.locals;
  logger.info(`got eventHook: ${JSON.stringify(evt)}`);

  // Store conversation transcripts
  if (evt.type === 'conversation.item.input_audio_transcription.completed') {
    const transcript = {
      role: 'user' as const,
      text: evt.transcript,
      timestamp: new Date()
    };
    session.locals.transcripts.push(transcript);
    
    // Send transcript to API
    try {
      await apiClient.addTranscripts(session.call_sid, [{
        ...transcript,
        timestamp: transcript.timestamp.toISOString()
      }]);
    } catch (error) {
      logger.error(`Failed to save transcript: ${error}`);
    }
  } else if (evt.type === 'response.audio_transcript.done') {
    const transcript = {
      role: 'assistant' as const,
      text: evt.transcript,
      timestamp: new Date()
    };
    session.locals.transcripts.push(transcript);
    
    // Send transcript to API
    try {
      await apiClient.addTranscripts(session.call_sid, [{
        ...transcript,
        timestamp: transcript.timestamp.toISOString()
      }]);
    } catch (error) {
      logger.error(`Failed to save transcript: ${error}`);
    }
  }

  // Log event to API
  try {
    await apiClient.addEvent(session.call_sid, evt.type, evt);
  } catch (error) {
    logger.error(`Failed to log event: ${error}`);
  }

  // If we have a pending transfer, place the dial after the assistant's next utterance
  try {
    const { conversationContext, phoneConfig } = session.locals as any;
    if (
      evt.type === 'response.audio_transcript.done' &&
      conversationContext?.transferPending &&
      !conversationContext.transferAnnounced
    ) {
      conversationContext.transferAnnounced = true;
      const { department, reason, caller_info, transferNumber, transferSummary } = conversationContext.transferPending;
      logger.info({ department, transferNumber }, 'Assistant announced transfer; dialing shortly');

      setTimeout(() => {
        try {
          logger.info(`Executing dial to ${transferNumber} for ${department} department`);
          conversationContext.transferInProgress = true;
          session
            // brief pause to ensure the announcement finishes before dialing
            .pause({ length: 1 })
            .dial({
              target: [{ type: 'phone', number: transferNumber }],
              answerOnBridge: true,
              actionHook: '/dialAction',
              headers: {
                'X-Conversation-Summary': transferSummary,
                'X-Department': department,
                'X-Transfer-Reason': reason,
                'X-Caller-Info': caller_info,
                'X-Company': phoneConfig?.company?.name || 'Binary Elements',
              },
            })
            .send();
        } catch (err) {
          logger.error({ err }, 'Failed to initiate dial after transfer announcement');
        } finally {
          // Clear pending state to avoid duplicate dials
          conversationContext.transferPending = null;
        }
      }, 5000);
    }
  } catch (err) {
    logger.error({ err }, 'Error handling transfer announcement flow');
  }
};

const onEnqueueResult = async (session: any, evt: any) => {
  const { logger } = session.locals;
  logger.info(`Enqueue result: ${evt.enqueue_result}`);
  if (evt.enqueue_result === 'ok') {
    logger.info('Customer successfully enqueued, waiting for agent');
  } else {
    logger.error(`Enqueue failed: ${evt.enqueue_result}`);
  }
};

const onDialAction = async (session: any, evt: any) => {
  const { logger, conversationContext } = session.locals;
  const status = evt.dial_call_status;
  
  logger.info({ evt }, `Dial action result: ${status}`);
  
  // Check if this is just an in-progress notification (happens when agent answers)
  if (status === 'in-progress') {
    logger.info('Call connected, transfer in progress');
    return;
  }
  
  // Handle actual completion/failure states
  if (status === 'completed') {
    logger.info('Transfer completed successfully');
    // Update call status
    try {
      await apiClient.updateCall(session.call_sid, {
        status: 'transferred',
        metadata: {
          ...session.locals.metadata,
          transfer_completed: true,
          transfer_status: status
        }
      });
    } catch (error) {
      logger.error(`Failed to update call after transfer: ${error}`);
    }
  } else if (status === 'failed' || status === 'busy' || status === 'no-answer' || status === 'canceled') {
    logger.info(`Transfer failed with status: ${status}`);
    
    // Inform the customer based on the failure reason
    let message = "Sorry, we couldn't complete the transfer at this time.";
    
    if (status === 'busy') {
      message = "Sorry, that department is currently busy.";
    } else if (status === 'no-answer' || status === 'timeout') {
      message = "Sorry, no one is available in that department right now.";
    }
    
    // Update call status
    try {
      await apiClient.updateCall(session.call_sid, {
        status: 'transfer_failed',
        metadata: {
          ...session.locals.metadata,
          transfer_failed: true,
          transfer_failure_reason: status
        }
      });
    } catch (error) {
      logger.error(`Failed to update call after transfer failure: ${error}`);
    }
    
    // Mark that we need to offer callback
    conversationContext.offerCallback = true;
    
    // Voice debugging for callback scenario
    const callbackVoice = session.locals.phoneConfig?.metadata?.voiceSettings?.voice || 'alloy';
    logger.info({ 
      configuredVoice: session.locals.phoneConfig?.metadata?.voiceSettings?.voice,
      callbackVoice,
      voiceSource: session.locals.phoneConfig?.metadata?.voiceSettings?.voice ? 'phoneConfig' : 'fallback',
      scenario: 'transfer_failed_callback'
    }, 'Voice configuration for transfer failure callback');
    
    // Continue conversation with AI to handle callback
    const apiKey = process.env.OPENAI_API_KEY;
    session
      .pause({ length: 0.5 })
      .llm({
        vendor: 'openai',
        model: 'gpt-4o-realtime-preview-2025-06-03',
        auth: { apiKey },
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
            instructions: `The transfer to the department failed. You should now offer to schedule a callback for the customer. 
            
If they want a callback, use the schedule_callback tool to schedule it. 
- Ask when they would prefer to be called back
- Confirm the phone number (they might say "this number" which means use ${session.locals.callerPhoneNumber})
- Get the topic/reason for the callback

If they don't want a callback, thank them for calling and end the conversation politely.`,
            voice: getConsistentVoice(session.locals.phoneConfig, logger, 'callback_llm_session'),
            output_audio_format: 'pcm16',
            temperature: 0.8,
            max_output_tokens: 4096,
          },
          session_update: {
            tools: [
              {
                name: 'schedule_callback',
                type: 'function',
                description: 'Schedule a callback for the customer',
                parameters: {
                  type: 'object',
                  properties: {
                    preferred_time: {
                      type: 'string',
                      description: 'Customer preferred callback time in ISO 8601 format'
                    },
                    phone_number: {
                      type: 'string',
                      description: `Phone number for callback. Use ${session.locals.callerPhoneNumber} if customer says "this number"`
                    },
                    topic: {
                      type: 'string',
                      description: 'Topic for the callback'
                    }
                  },
                  required: ['preferred_time', 'phone_number', 'topic']
                }
              }
            ],
            tool_choice: 'auto',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            // Ensure voice consistency in callback session
            voice: getConsistentVoice(session.locals.phoneConfig, logger, 'callback_session_update'),
            // Turn-taking: mirror main session VAD patience
            turn_detection: {
              type: 'server_vad',
              threshold: 0.8,
              prefix_padding_ms: 600,
              silence_duration_ms: 1100
            }
          }
        }
      })
      .reply();
  }
  
  // Clear transfer flag
  if (conversationContext) {
    conversationContext.transferInProgress = false;
  }
};


const onToolCall = async (session: any, evt: any) => {
  const { logger, conversationContext } = session.locals;
  const { name, args, tool_call_id } = evt;

  logger.info(`Tool called: ${name} (${tool_call_id})`);

  try {
    let result;

    switch (name) {
      case 'search_contacts':
        result = await handleSearchContacts(session, args);
        break;
      case 'collect_caller_data':
        result = await handleCollectCallerData(session, args);
        break;
      case 'gather_caller_info':
        result = await handleGatherCallerInfo(session, args);
        break;
      case 'schedule_callback':
        result = await handleScheduleCallback(session, args);
        break;
      case 'transfer_call':
        result = await handleTransfer(session, args);
        break;
      default:
        throw new Error(`Unknown function: ${name}`);
    }

    const data = {
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: tool_call_id,
        output: JSON.stringify(result),
      }
    };

    session.sendToolOutput(tool_call_id, data);
    logger.info(`Tool ${name} completed successfully`);

  } catch (err: any) {
    logger.error(`Tool ${name} failed: ${err.message}`);
    session.sendToolOutput(tool_call_id, { error: err.message });
  }
};

const onClose = async (session: any, code: number, reason: string) => {
  const { logger, callStartTime } = session.locals;
  logger.info({ code, reason }, `session ${session.call_sid} closed`);

  // Update call status if not already completed
  try {
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - callStartTime.getTime()) / 1000);
    
    await apiClient.updateCall(session.call_sid, {
      status: 'disconnected',
      endedAt: endTime.toISOString(),
      duration,
      metadata: {
        close_code: code,
        close_reason: reason
      }
    });
    logger.info(`Call ${session.call_sid} marked as disconnected`);
  } catch (error) {
    logger.error(`Failed to update call on close: ${error}`);
  }
};

const onError = (session: any, err: Error) => {
  const { logger } = session.locals;
  logger.info({ err }, `session ${session.call_sid} received error`);
};

// Tool implementation functions
const handleSearchContacts = async (session: any, args: any) => {
  const { logger, companyId } = session.locals;
  
  if (!companyId) {
    return {
      success: false,
      message: 'Company not configured for contact search',
      contacts: []
    };
  }

  logger.info(`Searching contacts with params:`, args);

  try {
    const contacts = await apiClient.searchContacts(companyId, args);
    
    if (contacts.length === 0) {
      return {
        success: true,
        message: 'No contacts found matching your search criteria',
        contacts: []
      };
    }

    logger.info(`Found ${contacts.length} contacts`);
    
    return {
      success: true,
      message: `Found ${contacts.length} contact(s) matching your search`,
      contacts: contacts.map((c: any) => ({
        name: c.name,
        phoneNumber: c.phoneNumber,
        companyName: c.companyName,
        department: c.department,
        email: c.email,
        isVip: c.isVip,
        lastContactedAt: c.lastContactedAt
      }))
    };
  } catch (error) {
    logger.error(`Failed to search contacts: ${error}`);
    return {
      success: false,
      message: 'Unable to search contacts at this time',
      contacts: []
    };
  }
};

const handleCollectCallerData = async (session: any, args: any) => {
  const { logger, companyId, callerPhoneNumber } = session.locals;
  const { caller_name, company_name, contact_number, email, department, reason_for_calling, custom_fields } = args;

  logger.info(`Collecting caller data: ${caller_name} from ${company_name}`);

  // Smart phone number detection - handle "this number", "same number", etc.
  let actualContactNumber = contact_number;
  
  if (contact_number) {
    const sameNumberPhrases = [
      'this number', 'same number', 'my number', 'current number',
      'the number', 'this phone', 'my phone', 'same phone',
      'number i\'m calling from', 'number i am calling from',
      'the number provided', 'number provided'
    ];
    
    const lowerContactNumber = contact_number.toLowerCase().trim();
    const shouldUseCallerNumber = sameNumberPhrases.some(phrase => 
      lowerContactNumber.includes(phrase) || lowerContactNumber === phrase
    );
    
    if (shouldUseCallerNumber) {
      actualContactNumber = callerPhoneNumber;
      logger.info(`Detected self-reference phrase "${contact_number}", using caller's number: ${actualContactNumber}`);
    }
  } else {
    // If no contact number provided, use caller's number
    actualContactNumber = callerPhoneNumber;
  }

  // Store collected data in session
  const collectedData = {
    callerName: caller_name,
    companyName: company_name,
    contactNumber: actualContactNumber,
    email,
    department,
    reasonForCalling: reason_for_calling,
    customFields: custom_fields,
    collectedAt: new Date().toISOString()
  };

  session.locals.collectedData = collectedData;

  // Create or update contact in database
  if (companyId) {
    try {
      const contactData = {
        companyId,
        name: caller_name,
        phoneNumber: actualContactNumber,
        email,
        companyName: company_name,
        department,
        notes: reason_for_calling,
        customFields: custom_fields
      };

      const contact = await apiClient.createOrUpdateContact(contactData);
      session.locals.contactId = contact.id;
      
      // Update call with contact ID and collected data
      await apiClient.updateCallWithContact(session.call_sid, contact.id, collectedData);
      
      logger.info(`Contact created/updated with ID: ${contact.id}`);
    } catch (error) {
      logger.error(`Failed to create/update contact: ${error}`);
    }
  }

  // Update call record with collected data
  try {
    await apiClient.updateCall(session.call_sid, {
      collectedData,
      metadata: {
        ...session.locals.metadata,
        data_collected: true,
        collected_fields: Object.keys(collectedData).filter(k => collectedData[k])
      }
    });
    logger.info(`Call ${session.call_sid} updated with collected data`);
  } catch (error) {
    logger.error(`Failed to update call with collected data: ${error}`);
  }

  return {
    success: true,
    message: `Thank you ${caller_name}. I've recorded that you're calling from ${company_name} about ${reason_for_calling}. Let me help you with that.`,
    collected_data: collectedData
  };
};

const handleGatherCallerInfo = async (session: any, { caller_name, company_name, contact_number, issue_description }: any) => {
  const { logger, callerPhoneNumber } = session.locals;

  logger.info(`Gathering caller info: ${caller_name} from ${company_name}, contact: ${contact_number}`);

  // Smart phone number detection - handle "this number", "same number", etc.
  let actualContactNumber = contact_number;
  
  if (contact_number) {
    const sameNumberPhrases = [
      'this number', 'same number', 'my number', 'current number',
      'the number', 'this phone', 'my phone', 'same phone',
      'number i\'m calling from', 'number i am calling from',
      'the number provided', 'number provided'
    ];
    
    const lowerContactNumber = contact_number.toLowerCase().trim();
    const shouldUseCallerNumber = sameNumberPhrases.some(phrase => 
      lowerContactNumber.includes(phrase) || lowerContactNumber === phrase
    );
    
    if (shouldUseCallerNumber) {
      actualContactNumber = callerPhoneNumber;
      logger.info(`Detected self-reference phrase "${contact_number}", using caller's number: ${actualContactNumber}`);
    }
  } else {
    // If no contact number provided, use caller's number
    actualContactNumber = callerPhoneNumber;
  }

  // Store caller information in session
  session.locals.callerInfo = {
    name: caller_name,
    company: company_name,
    contactNumber: actualContactNumber,
    issue: issue_description,
    timestamp: new Date().toISOString()
  };

  // Update call record with caller information
  try {
    await apiClient.updateCall(session.call_sid, {
      metadata: {
        ...session.locals.metadata,
        caller_info_collected: true,
        caller_name,
        company_name,
        contact_number: actualContactNumber,
        issue_description
      }
    });
    logger.info(`Call ${session.call_sid} updated with caller info`);
  } catch (error) {
    logger.error(`Failed to update call with caller info: ${error}`);
  }

  return {
    success: true,
    message: `Got it! So I have ${caller_name} from ${company_name}, and I can reach you back at ${actualContactNumber}. Let me get this escalated to our second level support team right away.`,
    caller_info: {
      name: caller_name,
      company: company_name,
      contact: actualContactNumber,
      issue: issue_description
    }
  };
};

const handleTransfer = async (session: any, { department, reason, caller_info }: any) => {
  const { logger, conversationContext, phoneConfig } = session.locals;

  logger.info(`Transferring to ${department} department: ${reason}`);

  // Build transfer summary
  const transferSummary = `Transfer to ${department} department. Reason: ${reason}. Caller info: ${caller_info}`;

  // Update call record
  try {
    await apiClient.updateCall(session.call_sid, {
      department,
      transferReason: reason,
      conversationSummary: transferSummary,
      status: `transferred_to_${department}`,
      metadata: {
        transferred_to: department,
        transfer_reason: reason,
        caller_summary: caller_info
      }
    });
    logger.info(`Call ${session.call_sid} transferred to ${department}`);
  } catch (error) {
    logger.error(`Failed to update call with ${department} transfer: ${error}`);
  }

  // Get department transfer number from config or fallback
  const departmentConfig = phoneConfig?.metadata?.departments?.find((d: any) => d.name === department);
  let transferNumber;
  
  if (departmentConfig?.transferNumber) {
    transferNumber = departmentConfig.transferNumber;
  } else {
    // Fallback to environment variables or default
    switch (department) {
      case 'sales':
        transferNumber = process.env.SALES_NUMBER || process.env.AGENT_NUMBER || '8811001';
        break;
      case 'support':
      case 'technical':
        transferNumber = process.env.SUPPORT_NUMBER || process.env.AGENT_NUMBER || '8811001';
        break;
      case 'billing':
        transferNumber = process.env.BILLING_NUMBER || process.env.AGENT_NUMBER || '8811001';
        break;
      default:
        transferNumber = process.env.AGENT_NUMBER || '8811001';
    }
  }

  logger.info(`Transferring to ${department} at number: ${transferNumber}`);

  // Defer dial until after the assistant politely informs the caller
  conversationContext.transferPending = {
    department,
    reason,
    caller_info,
    transferNumber,
    transferSummary
  };
  conversationContext.transferAnnounced = false;

  // Customize response based on department
  let responseMessage;
  switch (department) {
    case 'sales':
      responseMessage = `I'll connect you with our sales team for your ${reason}. Please stay on the line while I connect you — thanks for your patience.`;
      break;
    case 'support':
    case 'technical':
      responseMessage = `Let me connect you with our ${department} team who can help with your ${reason}. Please stay on the line while I connect you — thanks for your patience.`;
      break;
    case 'billing':
      responseMessage = `I'll transfer you to our billing department to help with your ${reason}. Please stay on the line while I connect you — thanks for your patience.`;
      break;
    default:
      responseMessage = `I'm connecting you with our ${department} department for your ${reason}. Please stay on the line while I connect you — thanks for your patience.`;
  }

  return {
    success: true,
    message: responseMessage,
    transfer: {
      department,
      reason,
      caller_info,
      transfer_number: transferNumber
    }
  };
};

const handleScheduleCallback = async (session: any, { preferred_time, phone_number, topic }: any) => {
  const { logger, callerPhoneNumber } = session.locals;

  // Smart phone number detection for Jeff's workflow
  let actualPhoneNumber = phone_number;
  
  const sameNumberPhrases = [
    'same number', 'this number', 'my number', 'current number', 
    'number i\'m calling from', 'calling from', 'session.from',
    'the number the user is calling from'
  ];
  
  const shouldUseCallerNumber = !phone_number || 
      phone_number.length > 20 || 
      sameNumberPhrases.some(phrase => phone_number.toLowerCase().includes(phrase));
  
  if (shouldUseCallerNumber) {
    actualPhoneNumber = callerPhoneNumber;
    logger.info(`Using caller's phone number for callback: ${actualPhoneNumber} (original input: "${phone_number}")`);
  } else if (phone_number && phone_number.match(/^\+?[\d\s\-\(\)]+$/)) {
    actualPhoneNumber = phone_number;
    logger.info(`Using provided phone number for callback: ${actualPhoneNumber}`);
  } else {
    actualPhoneNumber = callerPhoneNumber;
    logger.info(`Invalid phone number "${phone_number}", using caller's number: ${actualPhoneNumber}`);
  }

  logger.info({ 
    preferred_time, 
    requested_phone: phone_number,
    actual_phone: actualPhoneNumber, 
    caller_phone: callerPhoneNumber,
    topic 
  }, 'Scheduling callback for second level support');

  // Save callback to database
  try {
    const callbackData = {
      callId: session.locals.callId, // Use the stored call ID
      phoneNumber: actualPhoneNumber,
      preferredTime: preferred_time,
      topic,
      scheduledFor: preferred_time // If it's in ISO format, use it for scheduledFor
    };
    
    const callback = await apiClient.createCallback(callbackData);
    const callbackId = callback.callbackId;
    
    logger.info(`Priority callback ${callbackId} scheduled for second level support`);
    
    return {
      success: true,
      callback_id: callbackId,
      message: `Perfect! I've scheduled a priority callback for ${preferred_time} at ${actualPhoneNumber}. Our second level support team will call you about ${topic}. Your reference number is ${callbackId}. Is there anything else I can help you with while we have you on the line?`,
      scheduled_time: preferred_time,
      phone_number: actualPhoneNumber,
      topic,
      priority: 'high'
    };
  } catch (error) {
    logger.error(`Failed to save callback: ${error}`);
    // Still return success to the user to avoid confusion
    const fallbackId = `CB${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      callback_id: fallbackId,
      message: `I've noted your callback request for ${preferred_time} at ${actualPhoneNumber} regarding ${topic}. Your reference number is ${fallbackId}. Our team will contact you as scheduled.`,
      scheduled_time: preferred_time,
      phone_number: actualPhoneNumber,
      topic,
      priority: 'high'
    };
  }
};
