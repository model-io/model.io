var _ = require('lodash');
var http = require('http');
var sockjs = require('sockjs');
var WSM = require('websocket-multiplex').MultiplexServer;

var ws = sockjs.createServer();
var baseCh = new WSM(ws);
var toJSON = JSON.stringify;
var fromJSON = JSON.parse;

var modelCh = baseCh.registerChannel('_model');
var models;

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

function superClasses(model) {
  model.superClasses = model.superClasses || _.pick(models, function(parent) {
    return model.prototype instanceof parent;
  });
  return model.superClasses;
}

function superClassName(model, name) {
  _.each(superClasses(model), function(superClass, superClassName) {
    model.superClasses = _.omit(model.superClasses, _.keys(superClasses(superClass)));
  });
  return _.keys(model.superClasses)[0];
}

function methods(model) {
  return _(model.p).omit(function(method, name) {
    return name.match(/constructor/) ||
           (method.type !== ModelIOServer.TYPE_PUBLIC && name !== 'init');
  }).map(function(method, name) {
    return [name, method.toString()];
  }).object().valueOf();
}

function ModelIOServer(app, _models) {
  var server;
  if (app.callback) {
    server = http.Server(app.callback());
  } else {
    server = http.Server(app);
  }
  ws.installHandlers(server, {prefix:'/ws'});
  models = _models;
  pushModels(_.map(models, function(model, name) {
    model.ch = baseCh.registerChannel(name);
    model.ch.on('connection', function(conn) {
      conn.on('data', function(message) {
        message = fromJSON(message);
        var args = message.data;
        var user = 'Dude';
        args.unshift(user);
        args.push(function(err, res) {
          conn.write(toJSON(res));
        });
        model[message.method].apply(model, args);
      });
    });
    return {
      name: name,
      classProperties: classProperties(model),
      superClassName: superClassName(model, name),
      methods: methods(model)
    };
  }));
  return server;
}

ModelIOServer.TYPE_PUBLIC = 'public';
ModelIOServer.TYPE_PROXY = 'proxy';
ModelIOServer.TYPE_PRIVATE = 'private';

module.exports = ModelIOServer;
