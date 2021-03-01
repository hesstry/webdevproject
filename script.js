var express = require('express');

var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
var bodyParser = require('body-parser');
var session = require('express-session');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.use(session({secret:'393790cae6e47c9adf022a8fb678becd3b3fb5109b80a4ab089dd90971d4a7a44ddb7911d780328600c6e1412925d7bd0a8b8915f49e1e8fde9d4185c336fa95'}));

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 3000);

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

app.post('/contactme', function(req, res){

  let context = {'data':{}};
  console.log(req.body);

  if (req.body.name){
    context.data.name = req.body.name;
    context.data.email = req.body.email;
    context.data.message = req.body.message;
  }

  console.log(context);

  res.render('contactme', context);
});

app.use(function(req,res){
  res.status(404);
  res.render('404');
});

app.use(function(err, req, res, next){
  console.error(err.stack);
  res.type('plain/text');
  res.status(500);
  res.render('500');
});

app.listen(app.get('port'), function(){
  console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});