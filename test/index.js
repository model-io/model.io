var Browser = require("zombie");
var expect = require("expect.js");

describe("visit", function() {
  var browser;
  before(function(done) {
    browser = new Browser();
    browser
      .visit("http://localhost:3000/")
      .then(done, done);
  });

  it("should have models available", function(done) {
    setTimeout(function() {
      expect(browser.window.models).to.have.property('Dog');
      expect(browser.window.models).to.have.property('Chihuahua');
      var chichi = new browser.window.models.Chihuahua();
      expect(chichi.bark).to.be.a('function');
      expect(chichi instanceof browser.window.models.Dog).to.be.ok();
      done();
    }, 10);
  });
});
