var _ = require('lodash');
var http = require('http')
var sockjs = require('sockjs');
var WSM = require('websocket-multiplex').MultiplexServer;


var ws = sockjs.createServer();
var baseCh = new WSM(ws);
var toJSON = JSON.stringify;
var fromJSON = JSON.parse;

var modelCh = baseCh.registerChannel('_model');
var echo = baseCh.registerChannel('_sock');

var models;

echo.on('connection', function(conn) {
  conn.on('data', function(message) {
    message = JSON.parse(message);
    var parts = message.method.split('.');
    var model = models[parts[0]];
    var action = model[parts[1]];
    var user = 'Admin';
    var args = message.data;
    args.unshift(user);
    args.push(function(err, res) {
      res[0].bark('ouuu');
      conn.write(JSON.stringify(res));
    });
    console.log(model);
    model.find.apply(model, args);
  });
  conn.on('close', function() {});
});

function pushModels(models) {
  modelCh.on('connection', function(conn) {
    conn.write(toJSON(models));
  });
}

module.exports = function(app, _models) {
  var server = http.Server(app.callback());
  ws.installHandlers(server, {prefix:'/ws'});
  models = _models;
  pushModels(_.map(models, function(model, name) {
    model.ch = baseCh.registerChannel(name);
    model.ch.on('connection', function(conn) {
      conn.on('data', function(message) {
        message = fromJSON(message)
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
      methods: {
        bark: model.p.bark.toString()
      }
    }
  }));
  return server;
}
