var mongoose = require('mongoose');
var ModelIOSchema = require('../../Schema');

var DogSchema = ModelIOSchema.extend({
  name: String,
  color: String
});

var Dog = mongoose.model('Dog', DogSchema);

module.exports = {
  Dog: Dog
};
