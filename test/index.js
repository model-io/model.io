var _ = require('lodash');
var Browser = require('zombie');
var expect = require('expect.js');
var p = require('pjs').P;
var uuid = require('node-uuid');
var Signal = require('signals');

var app = require('./server/app');
var serverIO = require('../');

describe('visit', function() {
  var browser;
  var models = {};
  var clientModels = {};
  var server;

  before(function(done) {

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

  describe('public class proxies', function() {
    it('should be possible to call', function(done) {
      expect(clientModels.Dog.findAll).to.be.a('function');
      clientModels.Dog.findAll(function(err, dogs) {
        expect(err).to.be.null;
        expect(dogs.length).to.be.above(0);
        expect(dogs[0]).to.be.a(clientModels.Dog)
        done();
      });
    });
    it('should instatiate nested models correctly', function(done) {
      clientModels.Dog.findAll(function(err, dogs) {
        expect(dogs[0].friends.length).to.be.above(0);
        expect(dogs[0].friends[0]).to.be.a(clientModels.Dog);
        expect(dogs[0].friends[0].name).to.be('Rondo');
        done();
      });
    });
    xit('should track references correctly', function(done) {
      clientModels.Dog.findAll(function(err, dogs) {
        expect(dogs[0].friends.length).to.be.above(0);
        expect(dogs[0].friends[1]).to.be.a(clientModels.Dog);
        expect(dogs[0].friends[1].name).to.be('Fluffy');
        expect(dogs[1].name).to.be('Fluffy');
        expect(dogs[1]).to.be(dogs[0].friends[1]);
        done();
      });
    });
  });

  describe('signals', function() {
    describe('fired serverside', function() {
      xit('should be fired also client side', function(done) {
        // TODO Make this pass!`
        // this will fail due to unknown reasons. Maybe zombie js did not transfer protptypes correctly
        // expect(clientModels.Dog.onBirth).to.be.a(Signal);
        // instaed we compare prototypes here
        expect(clientModels.Dog.onBirth.prototype).to.not.be(null).and.to.equal(new Signal().prototype);
        clientModels.Dog.onBirth.addOnce(function(puppy) {
          expect(puppy).to.be.a(clientModels.Dog);
          expect(puppy.name).to.be('Puppy');
          done();
        });
        models.Dog.onBirth.dispatch(new models.Dog({name: 'Puppy'}));
      });
    });
    describe('fired clientside', function() {
      xit('should be fired also server side', function(done) {
        models.Dog.onBirth.addOnce(function(polly) {
          expect(polly).to.be.a(models.Dog);
          expect(polly.name).to.be('Polly');
          done();
        });
        clientModels.Dog.onBirth.dispatch('polly');
      });
    });
  });

  after(function() {
    server.close();
  });
});
