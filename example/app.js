var mongoose = require('mongoose');
var extend = require('mongoose-schema-extend');
var Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/model-io-exmaple');

var GroupSchema = new Schema({
  name: String
});
var Group = mongoose.model('Group', GroupSchema);
var yourGroup = new Group({ name: 'Group' })
//yourGroup.save();

var UserSchema = new Schema({
  name: String,
  groups: [{ type: Schema.Types.ObjectId, ref: 'Group' }]
});
var User = mongoose.model('User', UserSchema);

var you = new User({
  name: 'You',
  groups: [yourGroup],
});
//you.save();
var member = new User({
  name: 'Member',
  groups: [yourGroup],
});
//member.save();
var other = new User({
  name: 'Other',
  groups: [],
});
//other.save();

var ModelIOSchema = new Schema({
  _read: { 
    owner: { type: [String], default: ['*'] },
    group: { type: [String], default: [] },
    all: { type: [String], default: [] }
  },
  _write: {
    owner: { type: [String], default: ['*'] },
    group: { type: [String], default: [] },
    all: { type: [String], default: [] }
  },
  _delete: {
    owner: { type: [String], default: ['*'] },
    group: { type: [String], default: [] },
    all: { type: [String], default: [] }
  },
  _owner: { type: Schema.Types.ObjectId, ref: 'User' },
  _group: { type: Schema.Types.ObjectId, ref: 'Group' }
});

ModelIOSchema.statics.findWithUser = function(user, conditions, fields, options, callback) {
  var query = this.find(null, fields, options);
  query.where({$and: [conditions,
    {$or: [
      {$and: [{_owner: user, '_read.owner': {$not: {$size: 0}}}]},
      {$and: [{_group: {$in: user.groups}}, {'_read.group': {$not: {$size: 0}}}]},
      {'_read.all': {$not: {$size: 0}}}
    ]}
  ]});
  console.log(query._conditions.$and[1]);
  query.exec(callback);
}

var DogSchema = ModelIOSchema.extend({
  name: String,
  color: String
});

var Dog = mongoose.model('Dog', DogSchema);

var dolly = new Dog({
  name: 'Dolly',
  color: 'black',
  _owner: you,
  _group: yourGroup
});

//dolly.save(function (err) {
//  if (err) console.error(err);
//  console.log('wuff');
//});

User.findOne({name: 'Member'}, function(err, you) {
  console.log(you);
  dolly = Dog.findWithUser(you, {name: 'Dolly'}, null, null, function(err, dogs) {
    console.log('found: ', dogs);
  });
});

