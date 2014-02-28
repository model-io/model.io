var express = require('express');

var app = express();

app.set('views', __dirname);
app.set('view engine', 'jade');

app.use(express.static(__dirname + '/../client/'));
app.use(express.static(__dirname + '/../..'));
app.get('/', function(req, res) {
  res.render('index');
});

module.exports = app;

//app.listen(8080);
