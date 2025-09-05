export const createDialAgentService = ({ logger, makeService }: any) => {
  const svc = makeService({ path: '/dial-agent' });

  svc.on('session:new', (session: any) => {
    session.locals = {
      logger: logger.child({ call_sid: session.call_sid }),
    };
    
    const cd = session.customerData || {};
    const conversation_summary = cd.conversation_summary || '';
    const phone_num = process.env.AGENT_NUMBER || '8811001';
    
    logger.info({ session }, `new incoming request for rest dial: ${session.call_sid}`);

    try {
      session
        .on('/dequeue', onDequeue.bind(null, session))
        .on('close', onClose.bind(null, session))
        .on('error', onError.bind(null, session));

      session
        .answer()
        .tag({
          data: {
            conversation_summary: conversation_summary || 'Customer transfer'
          }
        })
        .pause({ length: 1 })
        .say({ text: conversation_summary || 'You have an incoming customer call. If you are available, please stay on the line and I will connect you now.' })
        .bridge({
          call_sid: session.parent_call_sid,
          whisperHook: '/whisper'
        })
        .send();
    } catch (err: any) {
      session.locals.logger.info({ err }, `Dialagent - Error to responding to incoming call: ${session.call_sid}`);
      session.close();
    }
  });
};

const onDequeue = (session: any, evt: any) => {
  const { logger } = session.locals;
  logger.info({ evt }, 'dequeue result');
  
  if (evt.dequeue_result === 'timeout') {
    logger.info('caller hung up, sending message to agent');
    session
      .say({ text: "I'm sorry, the caller hung up." })
      .hangup()
      .send();
  } else {
    session
      .hangup()
      .send();
  }
};

const onClose = (session: any, code: number, reason: string) => {
  const { logger } = session.locals;
  logger.info({ session, code, reason }, `session ${session.call_sid} closed`);
};

const onError = (session: any, err: Error) => {
  const { logger } = session.locals;
  logger.info({ err }, `session ${session.call_sid} received error`);
};
