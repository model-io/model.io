var _ = require('lodash');

var modelCh
var models;

function pushModels(models) {
  modelCh.onConnect.add(function(conn) {
    conn.write(modelCh, models);
  });
}

function classSignals(model, modelName, adapter) {
  var signals =  adapter.classSignals(model);
  // create channel
  _.each(signals, function(signal, name) {
    var channel = modelCh.sub(modelName).sub('signal').sub(name);
    channel.onConnect.add(function(conn) {
      conn.subscriptions = [];
      // attach server side events
      var write = function write() {
        //check if connection is interested
        if (_.contains(conn.subscriptions, channel.id)) {
          var args = Array.prototype.slice.call(arguments, 0);
          conn.write(channel, args);
        }
      };
      signal.add(write);
      conn.onData.add(function(transportCh, data) {
        if (transportCh !== channel) {
          return;
        }
        switch (data) {
          case 'subscribe':
            conn.subscriptions.push(channel.id);
            conn.write(channel, {subscribeSuccess: true});
            break;
          case 'unsubscribe':
            conn.subscriptions = _.without(conn.subscriptions, channel.id);
            conn.write(channel, {unsubscribeSuccess: true});
            break;
          default:
            signal.remove(write);
            signal.dispatch.apply(signal, instantiate(data));
            signal.add(write);
        }
      });
    });
  });
  return _.keys(signals);
}

// TODO DRY up! same function is in client/models.js
function instantiate(thing, instances) {
  instances = instances || {};
  switch(typeof(thing)) {
    case 'object':
      if(thing._type && models[thing._type]) {
        thing = instances[thing._id] = instances[thing._id] || _.extend(new models[thing._type](thing, thing._id), thing);
      }
      //fall throught
    case 'array':
      // TODO Test if this recusion really works - doubt it
      for(var key in thing) {
        thing[key] = instantiate(thing[key], instances);
      }
  }
  return thing;
}


function ModelIOServer(baseCh, _models, adapter) {
  var server;
  adapter = adapter || require('./adapter/p');
  modelCh = baseCh.sub('model');
  models = _models;
  pushModels(_.map(models, function(Model, name) {
    Model.ch = modelCh.sub(name);
    return {
      name: name,
      superClassName:  adapter.superClassName(Model, models),
      instanceMethods: adapter.instanceMethods(Model),
      instanceProxies: adapter.instanceProxies(Model),
      classProperties: adapter.classProperties(Model),
      classMethods:    adapter.classMethods(Model),
      classProxies:    adapter.classProxies(Model),
      classSignals:    classSignals(Model, name, adapter)
    };
  }));
  return server;
}

ModelIOServer.TYPE_PUBLIC = 'public';
ModelIOServer.TYPE_PROXY = 'proxy';
ModelIOServer.TYPE_PRIVATE = 'private';

module.exports = ModelIOServer;
