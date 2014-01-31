var P = require('pjs').P;
var ModelIO = require('../../ModelIO');

var Dog = P(ModelIO, function($model, $super, $class, $superclass) {
  $model.bark = function(sound) {
    console.log(this.name + ' says: ' + sound || 'wufff!');
  }
});

module.exports = {
  Dog: Dog
};
