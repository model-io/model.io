var mongoose = require('mongoose');
var ModelIOSchema = require('../../Schema');

mongoose.connect('mongodb://localhost/model-io-exmaple');

var DogSchema = ModelIOSchema.extend({
  name: String,
  color: String
});

var Dog = mongoose.model('Dog', DogSchema);

module.exports = {
  Dog: Dog
};
