var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GroupSchema = new Schema({
  name: String
});
var Group = mongoose.model('Group', GroupSchema);

var UserSchema = new Schema({
  name: String,
  groups: [{ type: Schema.Types.ObjectId, ref: 'Group' }]
});
var User = mongoose.model('User', UserSchema);

module.exports = {
  Group: Group,
  User: User
};

