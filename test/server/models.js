var _ = require('lodash');
var p = require('pjs').P;
var Signal = require('signals');
var uuid = require('node-uuid');

var serverIO = require('../../');

module.exports = models = {};

models.Dog = p(function($model, $super, $class, $superclass) {
  $model.init = function(data, id) {
    // TODO find a way to not have to anotate the prototype name
    this._type = 'Dog';
    _.extend(this, data);
    this._id = id || uuid.v4(); //to track instances
  };

  /********* Instance methods *******/

  function bark(sound) {
    return this.name + ' says: ' + sound || 'wufff!';
  }
  $model.bark = bark;
  $model.bark.type = serverIO.TYPE_PUBLIC;

  function fetch(thing, bringBack) {
    bringBack(null, this.name + ' fetched the ' + thing);
  }
  $model.fetch = fetch;
  $model.fetch.type = serverIO.TYPE_PROXY;

  function eat(food) {
    return this.name + ' eats tasty ' + (food || 'meat') + '.';
  }
  $model.eat = eat;
  $model.eat.type = serverIO.TYPE_PRIVATE;

  /********* Class attributes *******/

  function findAll(findAllDone) {
    var dolly = new $class({name: 'Dolly'});
    var fluffy = new $class({name: 'Fluffy'});
    dolly.friends = [
      new $class({name: 'Rondo'}), //to test nested instances
      fluffy //to test references
    ]
    findAllDone(null, [dolly, fluffy]);
  }
  $class.findAll = findAll;
  $class.findAll.type = serverIO.TYPE_PROXY;

  function isSupspecyOf(klass) {
    return klass == 'mammel'; //oversimplified ;)
  }
  $class.isSupspecyOf = isSupspecyOf;
  $class.isSupspecyOf.type = serverIO.TYPE_PUBLIC;

  $class.numberOfLegs = 4; // public by default

  $class.numberOfEars = {
    value: 2,
    type: serverIO.TYPE_PUBLIC
  };

  $class.numberOfEyes = {
    value: 2,
    type: serverIO.TYPE_PRIVATE
  }

  /********* Class signals *******/

  $class.onBirth = new Signal();
});

models.Chihuahua = p(models.Dog, function($model, $super, $class, $superclass) {
  function init(data) {
    $super.init.call(this, {name: 'Susi'});
  }

  function bark() {
    return $super.bark.call(this, 'waffwaffwaff');
  }

  $model.bark = bark;
  $model.bark.type = serverIO.TYPE_PUBLIC;
  $model.init = init;

  // overwrite signal so it is not triggered together with the one from $superclass
  $class.onBirth = new Signal();
});

models.BlackChihuahua = p(models.Chihuahua, function() { });
