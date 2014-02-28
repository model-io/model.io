var _ = require('lodash');
var http = require('http');
var sockjs = require('sockjs');
var Signal = require('signals');
var Channel = require('sock-channels');

var ws = sockjs.createServer();
var baseCh = new Channel(ws, 'model.io');
var modelCh = baseCh.sub('model');
var models;

function pushModels(models) {
  modelCh.onConnect.add(function(conn) {
    conn.write(modelCh, models);
  });
}

function superClasses(model, models) {
  model.superClasses = model.superClasses || _.pick(models, function(parent) {
    return model.prototype instanceof parent;
  });
  return model.superClasses;
}

function superClassName(model, models) {
  _.each(superClasses(model, models), function(superClass, superClassName) {
    model.superClasses = _.omit(model.superClasses, _.keys(superClasses(superClass, models)));
  });
  return _.keys(model.superClasses)[0];
}

function instanceMethods(model) {
  return _(model.prototype).pick(function(method, name) {
    return model.prototype.hasOwnProperty(name) &&
           !name.match(/constructor/) &&
           (method.type === ModelIOServer.TYPE_PUBLIC || name === 'init');
  }).map(function(method, name) {
    return [name, method.toString()];
  }).object().valueOf();
}

function instanceProxies(model) {
  var proxies = _(model.prototype).pick(function(method, name) {
    return model.prototype.hasOwnProperty(name) &&
           method.type === ModelIOServer.TYPE_PROXY
  }).keys().valueOf();
  _.each(proxies, function(name) {
    var proxyCh = model.ch.sub('instanceProxy').sub(name)
    proxyCh.onData.add(function(conn, transport) {
      var args = transport.args;
      args.push(function(err, res) {
        proxyCh.write(conn, {err: err, res: res});
      });
      // TODO load 'right' instance
      // currently only the instance is extendet with this-data of frontend model
      var instance = new model();
      _.extend(instance, transport.data);
      return instance[name].apply(instance, args);
    });
  });
  return proxies;
}

function isPrimitive(thing) {
  return _.isNumber(thing) || _.isBoolean(thing) || _.isString(thing) || _.isRegExp(thing);
}

function classProperties(model) {
  return _(model).pick(function(property, name) {
    return model.hasOwnProperty(name) && (
             (_.isPlainObject(property) && property.type === ModelIOServer.TYPE_PUBLIC) ||
             isPrimitive(property)
           );
  }).map(function(property, name) {
    return [name, _.has(property, 'value') ? property.value : property];
  }).object().valueOf();
}

function classMethods(model) {
  return _(model).pick(function(method, name) {
    return model.hasOwnProperty(name) &&
           _.isFunction(method) &&
           method.type === ModelIOServer.TYPE_PUBLIC;
  }).map(function(method, name) {
    return [name, method.toString()];
  }).object().valueOf();
}

function classProxies(model) {
  var proxies =  _(model).pick(function(method, name) {
    return model.hasOwnProperty(name) &&
           _.isFunction(method) &&
           method.type === ModelIOServer.TYPE_PROXY
  }).keys().valueOf();

  _.each(proxies, function(name) {
    var proxyCh = model.ch.sub('classProxy').sub(name)
    proxyCh.onData.add(function(conn, transport) {
      var args = transport.args;
      args.push(function(err, res) {
        proxyCh.write(conn, {err: err, res: res});
      });
      return model[name].apply(model, args);
    });
  });

  return proxies;
}

function classSignals(model, modelName) {
  return _(model).pick(function(method, name) {
    return model.hasOwnProperty(name) &&
           method instanceof Signal
  }).tap(function(signals) {
    // create channel
    _.each(signals, function(signal, name) {
      var channel = modelCh.sub(modelName).sub('signal').sub(name);
      channel.onConnect.add(function(conn) {
        // attach server side events
        var write = function write() {
          var args = Array.prototype.slice.call(arguments, 0);
          conn.write(channel, args);
        };
        signal.add(write);
        conn.onData.add(function(transportCh, data) {
          if (transportCh !== channel) {
            return;
          }
          signal.remove(write);
          signal.dispatch.apply(signal, instantiate(data));
          signal.add(write);
        });
      });
    });
  }).keys().valueOf();
}

function ModelIOServer(app, _models) {
  var server;
  models = _models;
  if (app.callback) {
    server = http.Server(app.callback());
  } else {
    server = http.Server(app);
  }
  ws.installHandlers(server, {prefix:'/ws'});
  pushModels(_.map(models, function(Model, name) {
    Model.ch = modelCh.sub(name);
    return {
      name: name,
      superClassName:  superClassName(Model, models),
      instanceMethods: instanceMethods(Model),
      instanceProxies: instanceProxies(Model),
      classProperties: classProperties(Model),
      classMethods:    classMethods(Model),
      classProxies:    classProxies(Model),
      classSignals:    classSignals(Model, name)
    };
  }));
  return server;
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

ModelIOServer.TYPE_PUBLIC = 'public';
ModelIOServer.TYPE_PROXY = 'proxy';
ModelIOServer.TYPE_PRIVATE = 'private';

module.exports = ModelIOServer;
