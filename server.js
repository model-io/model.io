var http = require('http')
var sockjs = require('sockjs');
var echo = sockjs.createServer();

var models;

echo.on('connection', function(conn) {
  conn.on('data', function(message) {
    message = JSON.parse(message);
    var parts = message.method.split('.');
    var model = models[parts[0]];
    var action = model[parts[1]];
    var args = message.data;
    args.push(function(err, res) {
      conn.write(JSON.stringify(res));
    });
    model.find.apply(model, args);
  });
  conn.on('close', function() {});
});

module.exports = function(app, _models) {
  var server = http.Server(app.callback());
  echo.installHandlers(server, {prefix:'/ws'});
  models = _models;
  return server;
}
