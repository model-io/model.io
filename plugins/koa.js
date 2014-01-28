_ = require('lodash');
fs = require('fs');

var modelTemplate = _.template(fs.readFileSync(__dirname + '/../templates/models.js.tpl').toString());

function middlware (options) {
  return function *(next) {
    if (this.path.toString() != '/models.js') {
      return yield next;
    }
    this.is('application/javascript');
    this.body = modelTemplate(options);
  }
}

module.exports = middlware;

