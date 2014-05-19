var http = require('http');

var sockjs = require('sockjs');
var Channel = require('sock-channels');

var app = require('./app');
var models = require('./models');
var serverIO = require('../../index');

var server = http.Server(app);
var ws = sockjs.createServer();
ws.installHandlers(server, {prefix:'/ws'});
var baseCh = new Channel(ws, 'model.io');

serverIO(baseCh, models)
server.listen(3000);

setInterval(function() {
  models.Dog.onBirth.dispatch(Math.random());
}, 2000);
