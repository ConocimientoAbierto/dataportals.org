var express = require('express'),
  path = require('path'),
  nunjucks = require('nunjucks'),
  logger = require('morgan'),
  bodyParser = require('body-parser'),
  methodOverride = require('method-override'),
  mongoose = require('mongoose');

var app = express();

// MONGOOSE CONFIG
var uriDB = 'mongodb://calidatos:datoscali@Localhost:27017/calidatos';
mongoose.connect(uriDB, (err) => err ? console.log(err) : console.log('Conected to DB'));

// TODO ver esto
var config = require('./lib/config.js'),
    model = require('./lib/model.js');

// config the app
app.set('views', __dirname + '/views');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

var env = new nunjucks.Environment(new nunjucks.FileSystemLoader('views'));
env.express(app);


// ROUTES CONFIG
var routes = require('./routes/index.js');
var portals = require('./routes/portals');

app.use('/api', portals);

app.get('/', function(req, res) {
  var catalogs = model.catalog.query();
  var total = catalogs.length;
  res.render('home.html', {
    catalogs: catalogs,
    total: total
  });
})

app.get('/about', function(req, res) {
  res.render('about.html', {});
});

app.get('/search', function(req, res) {
  var catalogs = model.catalog.query();
  var total = catalogs.length;
  res.render('search.html', {
    catalogs: catalogs,
    total: total
  });
});

app.get('/add', function(req, res) {
  res.render('add.html');
});

app.get('/catalog/:id', function(req, res) {
  res.redirect(301, '/portal/' + req.params.id);
});

app.get('/portal/:id', function(req, res) {
  var id = req.params.id;
  var thiscatalog = model.catalog.get(id)
  if (!thiscatalog) {
    res.send(404, 'Not Found');
  } else {
    res.render('catalog.html', {
      catalog: thiscatalog
    });
  }
});

app.get('/group/:id', function(req, res) {
  var id = req.params.id;
  var catalogs = model.catalog.getGroup(id)
  res.render('group.html', {
    group: id,
    catalogs: catalogs,
    total: catalogs.length
  });
});

app.get('/api/data.json', function(req, res) {
  res.json(model.catalog._cache);
});

app.get('/api/catalogs/:id', function(req, res) {
  var id = req.params.id;
  var c = model.catalog.get(id);
  console.log(c)
  if (!c) {
    res.send(404, 'Not Found');
  }
  res.header("Content-Type", "application/json; charset=utf-8");
  res.write(JSON.stringify(c));
  res.end();
});

app.get('/api/catalogs', function(req, res) {
  var catalogs = model.catalog.query();

  res.header("Content-Type", "application/json; charset=utf-8");
  res.write(JSON.stringify(catalogs));
  res.end();
});

app.get('/api/groups', function(req, res) {
  var groups = model.catalog.getGroups();

  res.header("Content-Type", "application/json; charset=utf-8");
  res.write(JSON.stringify(groups));
  res.end();
});

app.get('/admin/reload', routes.reload);

model.catalog.loadUrl(config.databaseUrl, function(err) {
  if (err) {
    console.error('Failed to load dataset info', err);
  }
});

module.exports = app;
