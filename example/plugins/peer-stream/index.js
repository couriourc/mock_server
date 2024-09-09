const config = require('./signal.json');
const fs = require('fs');
const child_process = require('child_process');
const G_StartUe5Pool = [];
function initUEe5Pool() {

}
export default function({app, logger, option}) {
  app.ws('/ws', {
    message(ws, message) {
      logger.info(option);
    },
  });
}
