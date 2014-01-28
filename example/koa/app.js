var koa = require('koa');
var views = require('koa-render');
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

app.listen(3000);
