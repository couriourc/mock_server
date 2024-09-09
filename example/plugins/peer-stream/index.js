export default function({app, logger, option}) {
  app.ws('/ws', {
    message(ws, message) {
      logger.info(option);
    },
  });
}
