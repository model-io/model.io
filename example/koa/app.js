var koa = require('koa');
var serve = require('koa-static');
var views = require('koa-render');
var app = koa();

var server = require('../../server.js');

var models = require('./models');

app.use(views(__dirname + '/views', 'jade'));

//register client js
app.use(serve(__dirname + '../../../client/'));

app.use(function *(){
  this.body = yield this.render('index');
});

server(app, models).listen(3000);

models.Dog({name: 'Rondo'}).bark('aahooooooooo');
