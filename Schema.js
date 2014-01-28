var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var extend = require('mongoose-schema-extend');
var util = require('util');
var _ = require('lodash');

const DEFAULT_ATTRIBUTES = ['_read', '_write', '_delete', '_owner', '_group'];
const INTERNAL_ATTRIBUTES = ['__v', '__t'];

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
  conditions = {$and: [
    conditions,
    {$or: [
      {$and: [{_owner: user}, {'_read.owner': {$not: {$size: 0}}}]},
      {$and: [{_group: {$in: user.groups}}, {'_read.group': {$not: {$size: 0}}}]},
      {'_read.all': {$not: {$size: 0}}}
    ]}
  ]};
  var query = this.find(conditions, fields, options);
  query.exec(function(err, collection) {
    collection = collection.map(function(entity) {
      entity._orig = entity._doc;
      var permissions = entity._read.all;
      if (entity.isOwner(user)) {
        permissions = _.union(permissions, entity._read.owner);
      }
      if (entity.isMember(user)) {
        permissions = _.union(permissions, entity._read.group);
      }
      return pick(entity, permissions);
    });
    callback(err, collection);
  });
};

ModelIOSchema.methods.isOwner = function(user) {
  return user.id == this._owner;
};

ModelIOSchema.methods.isMember = function(user) {
  return _.some(user.groups, function(group) {
    return group.toString() == this._group;
  }, this);
};

ModelIOSchema.methods.changedAttrs = function() {
  return _.keys(_.pick(this._doc, function(value, key) {
    return value != this._orig[key];
  }, this), this);
};

ModelIOSchema.methods.saveWithUser = function(user, saveDone) {
  var permissions = this._write.other;
  if (this.isOwner(user)) {
    permissions = _.union(permissions, this._write.owner);
  }
  if (this.isMember(user)) {
    permissions = _.union(permissions, this._write.group);
  }
  var notAllowedAttrs = _.difference(this.changedAttrs(), permissions);
  if (!_.isEmpty(notAllowedAttrs)) {
    saveDone(new Error('You tried to save not allowed attributes:' + notAllowedAttrs.join(', ')));
  } else {
    this.save(saveDone);
  }
}

function pick(entity, attributes) {
  entity._doc = _.contains(attributes, '*')
    ? _.omit(entity._doc, INTERNAL_ATTRIBUTES)
    : _.pick(entity._doc, _.union(attributes, DEFAULT_ATTRIBUTES));
  return entity;
}

module.exports = ModelIOSchema;
