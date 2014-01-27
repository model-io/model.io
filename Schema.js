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
      if (entity._owner == user.id) {
        return pick(entity, entity._read.owner);
      }
      isMember = _.some(user.groups, function(group) { 
        return group.toString() == entity._group;
      });
      if (isMember) {
        return pick(entity, entity._read.group);
      }
      return pick(entity, entity._read.all);
    });
    callback(err, collection);
  });
}

function pick(entity, attributes) {
  entity._doc = _.contains(attributes, '*')
    ? _.omit(entity._doc, INTERNAL_ATTRIBUTES)
    : _.pick(entity._doc, _.union(attributes, DEFAULT_ATTRIBUTES));
  return entity;
}

module.exports = ModelIOSchema;
