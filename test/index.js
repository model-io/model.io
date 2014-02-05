var Browser = require('zombie');
var expect = require('expect.js');
var P = require('pjs').P;

var app = require('./server/app');
var serverIO = require('../server');

describe('visit', function() {
  var browser;
  var models = {};
  var browserModels = {};
  var server;

  before(function(done) {

    models.Dog = P(function($model, $super, $class, $superclass) {
      $model.init = function(data) {
        _.extend(this, data);
      };

      function bark(sound) {
        console.log(this.name + ' says: ' + sound || 'wufff!');
      }

      $model.bark = bark;
      $model.bark.type = serverIO.TYPE_PUBLIC;
    });

    models.Chihuahua = P(models.Dog, function($model, $super, $class, $superclass) {
      $class.superClassName = 'Dog';
    
      function init(data) {
        $super.init.call(this, {name: 'Susi'});
      }

      function bark() {
        $super.bark.call(this, 'waffwaffwaff');
      }

      $model.bark = bark;
      $model.bark.type = serverIO.TYPE_PUBLIC;
      $model.init = init;
    });
    server = serverIO(app, models).listen(3000, function() {
      browser = new Browser();
      browser.visit('http://localhost:3000/', function() {
        browserModels = browser.window.models;
        done();
      });
    });
  });

  it('should have models available', function() {
    expect(browserModels).to.have.property('Dog');
    expect(browserModels).to.have.property('Chihuahua');
  });

  it('should be possible to instantiate models', function() {
    var chichi = new browserModels.Chihuahua();
    expect(chichi.bark).to.be.a('function');
    expect(chichi.name).to.be('Susi');
    expect(chichi instanceof browser.window.models.Dog).to.be.ok();
  });

  after(function() {
    server.close()
  });
});
