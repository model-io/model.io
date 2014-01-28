var koa = require('koa');
var views = require('koa-render');
var sockjs = require('sockjs');
var app = koa();

var modelio = require('../../plugins/koa.js');

var models = require('./models');

app.use(views(__dirname + '/views', 'jade'));

app.use(modelio({
  models: models
}));

app.use(function *(){
  this.body = yield this.render('index');
});

var http = require('http');

var echo = sockjs.createServer();
echo.on('connection', function(conn) {
    conn.on('data', function(message) {
        conn.write(message);
    });
    conn.on('close', function() {});
});
var server = require('http').Server(app.callback());
echo.installHandlers(server, {prefix:'/ws'});
server.listen(3000);
