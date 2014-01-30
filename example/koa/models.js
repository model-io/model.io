var mongoose = require('mongoose');
var ModelIOSchema = require('../../Schema');

mongoose.connect('mongodb://localhost/model-io-exmaple');

var DogSchema = ModelIOSchema.extend({
  name: String,
  color: String
});

DogSchema.methods.bark = function(sound) {
  console.log(this.name + ' says: ' + sound || 'wufff!');
}
var Dog = mongoose.model('Dog', DogSchema);

module.exports = {
  Dog: Dog
};
