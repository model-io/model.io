var http = require('http')
var sockjs = require('sockjs');
var echo = sockjs.createServer();

var models;

echo.on('connection', function(conn) {
    conn.on('data', function(message) {
        conn.write(message);
    });
    conn.on('close', function() {});
});

module.exports = function(app, _models) {
  var server = http.Server(app.callback());
  echo.installHandlers(server, {prefix:'/ws'});
  models = _models;
  return server;
}
