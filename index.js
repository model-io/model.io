var _ = require('lodash');
var http = require('http');
var sockjs = require('sockjs');
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

function classProperties(model) {
  return {
    superClassName: model.superClassName
  };
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
  return _(model.p).omit(function(method, name) {
    return name.match(/constructor/) ||
           (method.type !== ModelIOServer.TYPE_PUBLIC && name !== 'init');
  }).map(function(method, name) {
    return [name, method.toString()];
  }).object().valueOf();
}

function instanceProxies(model) {
  return _(model.p).pick(function(method, name) {
    return method.type === ModelIOServer.TYPE_PROXY
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
      superClassName: superClassName(Model, models),
      classProperties: classProperties(Model),
      instanceMethods: instanceMethods(Model),
      instanceProxies: instanceProxies(Model)
    };
  }));
  return server;
}

ModelIOServer.TYPE_PUBLIC = 'public';
ModelIOServer.TYPE_PROXY = 'proxy';
ModelIOServer.TYPE_PRIVATE = 'private';

module.exports = ModelIOServer;
