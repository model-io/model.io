var app = require('./app');
var models = require('./models');
var serverIO = require('../../index');

server = serverIO(app, models).listen(3000);

setInterval(function() {
  models.Dog.onBirth.dispatch(Math.random());
}, 2000);
