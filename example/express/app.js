var express = require('express');

var app = express();

app.set('views', __dirname);
app.set('view engine', 'jade');

//register client js
app.use(express.static(__dirname + '/../../test/client/'));
app.use(express.static(__dirname + '/../../'));
app.get('/', function(req, res) {
  res.render('index');
});

module.exports = app;
