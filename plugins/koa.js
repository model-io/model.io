_ = require('lodash');
fs = require('fs');

var modelTemplate = _.template(fs.readFileSync(__dirname + '/../client/models.js').toString());
var sockjs = fs.readFileSync(__dirname + '/../client/lib/sock.js').toString();

function middlware (options) {
  return function *(next) {
    if (!this.path.match(/\.js$/)) {
      return yield next;
    }
    this.is('application/javascript');
    if (this.path.toString() == '/sock.js') {
      this.body = sockjs;
      return;
    }
    this.body = modelTemplate(options);
  }
}

module.exports = middlware;

