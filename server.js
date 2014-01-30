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
    var args = message.data;
    args.push(function(err, res) {
      res[0].bark('ouuu');
      conn.write(JSON.stringify(res));
    });
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
  pushModels(_.map(models, function(model) {
    return {
      name: model.modelName,
      methods: {
        bark: model.schema.methods.bark.toString()
      }
    }
  }));
  return server;
}
