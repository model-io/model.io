var P = require('pjs').P;
var ModelIO = require('../../ModelIO');

var Dog = P(ModelIO, function($model, $super, $class, $superclass) {
  function bark(sound) {
    console.log(this.name + ' says: ' + sound || 'wufff!');
  }

  $model.bark = bark;
  $model.bark.pub = true;
});

var Chihuahua = P(Dog, function($model, $super, $class, $superclass) {
  $class.superClassName = 'Dog';

  function init(data) {
    $super.init.call(this, {name: 'Susi'});
  }

  function bark() {
    $super.bark.call(this, 'waffwaffwaff');
  }

  $model.bark = bark;
  $model.bark.pub = true;
  $model.init = init;
});

module.exports = {
  Dog: Dog,
  Chihuahua: Chihuahua
};
