var koa = require('koa');
var serve = require('koa-static');
var views = require('koa-render');
var app = koa();

var koaMW = require('../../plugins/koa.js');
var server = require('../../server.js');

var models = require('./models');

app.use(views(__dirname + '/views', 'jade'));

// register middleware
app.use(koaMW({
  models: models
}));

//register client js
app.use(serve('client/'));


app.use(function *(){
  this.body = yield this.render('index');
});

server(app, models).listen(3000);
