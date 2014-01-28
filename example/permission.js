var async = require('async');

var user = require('../User');
var Group = user.Group;
var User = user.User;
var ModelIOSchema = require('../Schema');

mongoose.connect('mongodb://localhost/model-io-exmaple');

//var you = new User({
//  name: 'You',
//  groups: [yourGroup],
//});
////you.save();
//var member = new User({
//  name: 'Member',
//  groups: [yourGroup],
//});
////member.save();
//var other = new User({
//  name: 'Other',
//  groups: [],
//});
////other.save();

async.parallel({
  you: User.findOne({name: 'You'}).exec,
  yourGroup: User.findOne().exec,
}, function(err, res) {
  var DogSchema = ModelIOSchema.extend({
    name: String,
    color: String
  });
  
  var Dog = mongoose.model('Dog', DogSchema);
  
  var dolly = new Dog({
    name: 'Dolly',
    color: 'black',
    _owner: res.you,
    _group: res.yourGroup
  });
  
  User.findOne({name: 'Member'}, function(err, you) {
    console.log(you);
    dolly = Dog.findWithUser(you, {name: 'Dolly'}, null, null, function(err, dogs) {
      console.log('found: ', dogs);
    });
  });
});

