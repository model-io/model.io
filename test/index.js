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

  it('should be possible to instantiate models', function() {
    var chichi = new clientModels.Chihuahua();
    expect(chichi.bark).to.be.a('function');
    expect(chichi.name).to.be('Susi');
    expect(chichi instanceof clientModels.Dog).to.be.ok();
    expect(chichi.bark()).to.be('Susi says: waffwaffwaff');
  });

  describe('public instance methods', function() {
    var clientDolly;
    var serverDolly;

    beforeEach(function() {
      clientDolly = new clientModels.Dog({name: 'Dolly'});
      serverDolly = new models.Dog({name: 'Dolly'});
    });

    it('should be possible to call public methods', function() {
      expect(clientDolly instanceof clientModels.Dog).to.be.ok();
      expect(clientDolly.bark('wrrrrrrrr!')).to.be(serverDolly.bark('wrrrrrrrr!'))
    });

    it('should not be possible to call non-public methods', function() {
      expect(clientDolly instanceof clientModels.Dog).to.be.ok();
      expect(clientDolly.eat).to.be(undefined);
      expect(serverDolly.eat).to.be.a('function');
      expect(serverDolly.eat()).to.be('Dolly eats tasty meat.');
    });

    it('should not be possible to call proxy methods', function(done) {
      expect(clientDolly instanceof clientModels.Dog).to.be.ok();
      expect(clientDolly.fetch).to.be.a('function');
      clientDolly.fetch('ball', function(err, thing) {
        expect(err).to.be(null);
        expect(thing).to.eql('Dolly fetched the ball');
        done();
      });
    });
  });

  after(function() {
    server.close();
  });
});
