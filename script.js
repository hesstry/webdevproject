var express = require('express');

var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
var bodyParser = require('body-parser');
var session = require('express-session');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 5345);

app.get('/',function(req,res){
  res.render('homepage');
});

app.get('/aboutme',function(req,res){
  res.render('aboutme');
});

app.get('/contactme',function(req,res){
  res.render('contactme');
});

app.get('/projects',function(req,res){
  res.render('projects');
});

app.listen(app.get('port'), function(){
  console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
