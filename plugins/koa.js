_ = require('lodash');
fs = require('fs');

var modelTemplate = _.template(fs.readFileSync(__dirname + '/../client/models.js').toString());

function middlware (options) {
  return function *(next) {
    if (!this.path.match(/\.js$/)) {
      return yield next;
    }
    this.is('application/javascript');
    this.body = modelTemplate(options);
  }
}

module.exports = middlware;

