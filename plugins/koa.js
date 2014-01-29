_ = require('lodash');
fs = require('fs');

var modelTemplate = _.template(fs.readFileSync(__dirname + '/../client/models.js').toString());

function middlware (options) {
  return function *(next) {
    if (!this.path.match(/models.js$/)) {
      return yield next;
    }
    this.body = modelTemplate(options);
  }
}

module.exports = middlware;

