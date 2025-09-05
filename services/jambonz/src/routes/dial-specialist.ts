export const createDialSpecialistService = ({ logger, makeService }: any) => {
  const svc = makeService({ path: '/dial-specialist' });

  svc.on('session:new', (session: any) => {
    session.locals = {
      logger: logger.child({ call_sid: session.call_sid }),
    };
    
    const { conversation_summary, queue } = session.customerData || {};
    logger.info({ session }, `new incoming request for dial specialist: ${session.call_sid}`);

    try {
      session
        .on('/dequeue', onDequeue.bind(null, session))
        .on('close', onClose.bind(null, session))
        .on('error', onError.bind(null, session));

      const summaryText = conversation_summary || 'Incoming call transferred to specialist.';
      
      session
        .say({ text: summaryText })
        .say({ text: 'Now you will be connected to the caller.' })
        .dequeue({
          name: queue,
          beep: true,
          timeout: 2,
          actionHook: '/dequeue',
        })
        .send();
    } catch (err) {
      session.locals.logger.error({ err }, `Error responding to dial specialist call: ${session.call_sid}`);
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
      .say({ text: 'I\'m sorry, the caller hung up.' })
      .hangup()
      .send();
  } else if (evt.dequeue_result === 'bridged') {
    logger.info('caller successfully connected to specialist');
  }
};

const onClose = (session: any, code: any, reason: any) => {
  const { logger } = session.locals;
  logger.info({ session, code, reason }, `dial specialist session ${session.call_sid} closed`);
};

const onError = (session: any, err: any) => {
  const { logger } = session.locals;
  logger.error({ err }, `dial specialist session ${session.call_sid} received error`);
};