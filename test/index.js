var Browser = require('zombie');
var expect = require('expect.js');
var P = require('pjs').P;

var ModelIO = require('../ModelIO');
var app = require('./server/app');
var serverIO = require('../server');

describe('visit', function() {
  var browser;
  var models = {};
  var server;

  before(function(done) {

    models.Dog = P(ModelIO, function($model, $super, $class, $superclass) {
      function bark(sound) {
        console.log(this.name + ' says: ' + sound || 'wufff!');
      }

      $model.bark = bark;
      $model.bark.pub = true;
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
      $model.bark.pub = true;
      $model.init = init;
    });
    server = serverIO(app, models).listen(3000, function() {
      browser = new Browser();
      browser.visit('http://localhost:3000/', done);
    });
  });

  it('should have models available', function() {
    expect(browser.window.models).to.have.property('Dog');
    expect(browser.window.models).to.have.property('Chihuahua');
    var chichi = new browser.window.models.Chihuahua();
    expect(chichi.bark).to.be.a('function');
    expect(chichi instanceof browser.window.models.Dog).to.be.ok();
  });

  after(function(done) {
    server.close()
    done();
  });
});
