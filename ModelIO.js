var _ = require('lodash');
var P = require('pjs').P;

var ModelIO = P(function($model, $super, $class, $superclass) {
  $model.init = function(data) {
    _.extend(this, data);
  };

  $model.save = function(user, saveDone) {
    console.log('save as ' + user);
    saveDone();
  }

  $class.find = function(user, filter, attributes, findDone) {
    findDone(null, [new this({name: 'Dolly'}), new this({name:'Rondo'})]);
  }
});

module.exports = ModelIO;
