var app = require('./app');
var models = require('./models');
var serverIO = require('../../index');

server = serverIO(app, models).listen(3000);
