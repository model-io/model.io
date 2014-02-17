var _ = require('lodash');
var http = require('http');
var sockjs = require('sockjs');
var Signal = require('signals');
var WSM = require('websocket-multiplex').MultiplexServer;

var ws = sockjs.createServer();
var baseCh = new WSM(ws);
var toJSON = JSON.stringify;
var fromJSON = JSON.parse;

var modelCh = baseCh.registerChannel('_model');

function pushModels(models) {
  modelCh.on('connection', function(conn) {
    conn.write(toJSON(models));
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
  return _(model.prototype).pick(function(method, name) {
    return model.prototype.hasOwnProperty(name) &&
           method.type === ModelIOServer.TYPE_PROXY
  }).keys().valueOf();
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
  return _(model).pick(function(method, name) {
    return model.hasOwnProperty(name) &&
           _.isFunction(method) &&
           method.type === ModelIOServer.TYPE_PROXY
  }).keys().valueOf();
}

function classSignals(model) {
  return _(model).pick(function(method, name) {
    return model.hasOwnProperty(name) &&
           method instanceof Signal
  }).keys().valueOf();
}

function ModelIOServer(app, models) {
  var server;
  if (app.callback) {
    server = http.Server(app.callback());
  } else {
    server = http.Server(app);
  }
  ws.installHandlers(server, {prefix:'/ws'});
  pushModels(_.map(models, function(Model, name) {
    Model.ch = baseCh.registerChannel(name);
    Model.ch.on('connection', function(conn) {
      conn.on('data', function(e) {
        e = fromJSON(e);
        var args = e.args;
        // TODO use current user
        var user = 'Dude';
        args.unshift(user);
        args.push(function(err, res) {
          conn.write(toJSON({err: err, res: res}));
        });
        // check if class proxy is called
        if (_.isFunction(Model[e.name]) && Model[e.name].type == ModelIOServer.TYPE_PROXY) {
          // call it
          return Model[e.name].apply(Model, args);
        }
        // TODO load 'right' instance
        // currently only the instance is extendet with this-data of frontend model
        var instance = new Model();
        _.extend(instance, e.data);
        // check if method exists and is of type proxy
        if (_.isFunction(instance[e.name]) && instance[e.name].type == ModelIOServer.TYPE_PROXY) {
          // call it
          return instance[e.name].apply(instance, args);
        }
        // otherwise: throw error
        conn.write(toJSON({err: 'Method with name `' + e.name + '` is not available'}));
      });
    });
    return {
      name: name,
      superClassName:  superClassName(Model, models),
      instanceMethods: instanceMethods(Model),
      instanceProxies: instanceProxies(Model),
      classProperties: classProperties(Model),
      classMethods:    classMethods(Model),
      classProxies:    classProxies(Model),
      classSignals:    classSignals(Model)
    };
  }));
  return server;
}

ModelIOServer.TYPE_PUBLIC = 'public';
ModelIOServer.TYPE_PROXY = 'proxy';
ModelIOServer.TYPE_PRIVATE = 'private';

module.exports = ModelIOServer;
