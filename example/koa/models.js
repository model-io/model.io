var P = require('pjs').P;
var ModelIO = require('../../ModelIO');

var Dog = P(ModelIO, function($model, $super, $class, $superclass) {
  $model.bark = function(sound) {
    console.log(this.name + ' says: ' + sound || 'wufff!');
  }
});

var Chihuahua = P(Dog, function($model, $super, $class, $superclass) {
  $class.superClassName = 'Dog';
  $model.init = function(data) {
    $super.init.call(this, {name: 'Susi'});
  }
  $model.bark = function() {
    $super.bark.call(this, 'waffwaffwaff');
  }
});

module.exports = {
  Dog: Dog,
  Chihuahua: Chihuahua
};
