export default function({app, logger}) {
  app.ws('/ws', {
    message(ws, message) {
      logger.info(message);
    },
  });
}
