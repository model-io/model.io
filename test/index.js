var _ = require('lodash');
var Browser = require('zombie');
var expect = require('expect.js');
var p = require('pjs').P;

var app = require('./server/app');
var serverIO = require('../');

describe('visit', function() {
  var browser;
  var models = {};
  var clientModels = {};
  var server;

  before(function(done) {

    models.Dog = p(function($model, $super, $class, $superclass) {
      $model.init = function(data) {
        _.extend(this, data);
      };

      /********* Instance methods *******/

      function bark(sound) {
        return this.name + ' says: ' + sound || 'wufff!';
      }

      function fetch(user, thing, bringBack) {
        bringBack(null, this.name + ' fetched the ' + thing);
      }

      function eat(food) {
        return this.name + ' eats tasty ' + (food || 'meat') + '.';
      }

      $model.bark = bark;
      $model.bark.type = serverIO.TYPE_PUBLIC;
      $model.eat = eat;
      $model.eat.type = serverIO.TYPE_PRIVATE;
      $model.fetch = fetch;
      $model.fetch.type = serverIO.TYPE_PROXY;

      /********* Class attributes *******/

      function numberOfLegs() {
        return 4;
      }

      function findAll(user, findAllDone) {
        findAllDone(null, [
          new $class({name: 'Dolly'}),
          new $class({name: 'Fluffy'})
        ]);
      }

      function isSupspecyOf(klass) {
        return klass == 'mammel'; //oversimplified ;)
      }

      $class.numberOfLegs = 4; // public by default
      $class.numberOfEars = {
        value: 2,
        type: serverIO.TYPE_PUBLIC
      };
      $class.numberOfEyes = {
        value: 2,
        type: serverIO.TYPE_PRIVATE
      }

      $class.isSupspecyOf = isSupspecyOf;
      $class.isSupspecyOf.type = serverIO.TYPE_PUBLIC;
      $class.findAll = findAll;
      $class.findAll.type = serverIO.TYPE_PROXY;
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
    });

    models.BlackChihuahua = p(models.Chihuahua, function() { });

    server = serverIO(app, models).listen(3000, function() {
      browser = new Browser();
      browser.visit('http://localhost:3000/', function() {
        clientModels = browser.window.models;
        done();
      });
    });
  });

  it('should have models available', function() {
    expect(clientModels).to.have.property('Dog');
    expect(clientModels).to.have.property('Chihuahua');
  });

  it('should exist only methods according model, not directly on inherited', function() {
    expect(clientModels).to.have.property('Chihuahua');
    expect(clientModels).to.have.property('BlackChihuahua');
    expect(clientModels.Chihuahua.prototype.hasOwnProperty('bark')).to.be.ok();
    // functions should exists in the prototype chain ...
    expect(clientModels.BlackChihuahua.prototype.bark).to.be.a('function');
    expect(clientModels.BlackChihuahua.prototype.fetch).to.be.a('function');
    // but not directly on the inherited models
    expect(clientModels.BlackChihuahua.prototype.hasOwnProperty('bark')).to.not.be.ok();
    expect(clientModels.BlackChihuahua.prototype.hasOwnProperty('fetch')).to.not.be.ok();
  });

  it('should exist only methods according model, not directly on inherited', function() {
    expect(clientModels).to.have.property('Chihuahua');
    expect(clientModels).to.have.property('BlackChihuahua');
    expect(clientModels.Chihuahua.prototype).to.have.property('bark');
    expect(clientModels.BlackChihuahua.prototype.hasOwnProperty('bark')).to.not.be.ok();
  });

  it('should be possible to instantiate models', function() {
    var chichi = new clientModels.Chihuahua();
    expect(chichi.bark).to.be.a('function');
    expect(chichi.name).to.be('Susi');
    expect(chichi instanceof clientModels.Dog).to.be.ok();
    expect(chichi.bark()).to.be('Susi says: waffwaffwaff');
  });

  describe('public instance methods', function() {
    it('should be callable', function() {
      var clientDolly = new clientModels.Dog({name: 'Dolly'});
      var serverDolly = new models.Dog({name: 'Dolly'});
      expect(clientDolly instanceof clientModels.Dog).to.be.ok();
      expect(clientDolly.bark('wrrrrrrrr!')).to.be(serverDolly.bark('wrrrrrrrr!'))
    });
  });

  describe('private instance methods', function() {
    it('shouldn\'t be callable', function() {
      var clientDolly = new clientModels.Dog({name: 'Dolly'});
      var serverDolly = new models.Dog({name: 'Dolly'});
      expect(clientDolly instanceof clientModels.Dog).to.be.ok();
      expect(clientDolly.eat).to.be(undefined);
      expect(serverDolly.eat).to.be.a('function');
      expect(serverDolly.eat()).to.be('Dolly eats tasty meat.');
    });
  });

  describe('proxy instance methods', function() {
    it('should be callable', function(done) {
      var clientDolly = new clientModels.Dog({name: 'Dolly'});
      expect(clientDolly instanceof clientModels.Dog).to.be.ok();
      expect(clientDolly.fetch).to.be.a('function');
      clientDolly.fetch('ball', function(err, thing) {
        expect(err).to.be(null);
        expect(thing).to.eql('Dolly fetched the ball');
        done();
      });
    });
  });

  describe('public class properties', function() {
    it('should be possible to get', function() {
      expect(clientModels.Dog.numberOfLegs).to.be(4);
      expect(clientModels.Dog.numberOfEars).to.be(2);
      expect(clientModels.Dog.numberOfEyes).to.be(undefined);
      expect(models.Dog.numberOfEyes.value).to.be(2);
    });
  });

  describe('public class methods', function() {
    it('should be possible to call', function() {
      expect(clientModels.Dog.isSupspecyOf).to.be.a('function');
      expect(clientModels.Dog.isSupspecyOf('mammel')).to.be(true);
      expect(clientModels.Dog.isSupspecyOf('fish')).to.be(false);
    });
  });

  after(function() {
    server.close();
  });
});
