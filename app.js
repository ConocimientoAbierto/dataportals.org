'use strict';

/** DEPENDENCIES **/
const express = require('express'),
  path = require('path'),
  nunjucks = require('nunjucks'),
  logger = require('morgan'),
  bodyParser = require('body-parser'),
  methodOverride = require('method-override'),
  mongoose = require('mongoose'),
  flash = require('connect-flash'),
  session = require('express-session'),
  csurf = require('csurf'),
  validator = require('express-validator');

const configAPP = require('./lib/configAPP');
const app = express();

/** MODELS **/
const Portal = require('./model/portals');

/** MONGOOSE CONFIG **/
mongoose.connect(configAPP.dbURL, (err) => err ? console.log(err) : console.log('Conected to DB'));

/** CONFIG EXPRESS APP **/
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(validator());
app.use(methodOverride(function(req, res){
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    const method = req.body._method;
    delete req.body._method;
    return method;
  }
}));
app.use(flash());
app.use(session({
  secret: configAPP.sessionSecret,
  resave: false,
  saveUninitialized: false
}));
app.use(csurf());

/** PASSPORT CONFIG **/
require('./lib/configPassport')(app);

const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.resolve(__dirname + '/views')));
env.express(app);

/** ROUTES CONFIG **/
const homeRoutes = require('./routes/home');
const portalsRoutes = require('./routes/portals');
const usersRoutes = require('./routes/users');

/** GENERAL MIDDLEWHERE **/
app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.message     = req.flash('message');
  res.locals._csrf       = req.csrfToken();
  res.locals.formErr     = req.flash('formErr')[0];
  next();
});

app.use('/', homeRoutes);
app.use('/portals', portalsRoutes);
app.use('/users', usersRoutes);


// TODO ver esto
// const routes = require('./routes/index.js');
// const config = require('./lib/config.js'),
//       model = require('./lib/model.js');

//
// app.get('/', function(req, res) {
//   const catalogs = model.catalog.query();
//   const total = catalogs.length;
//   res.render('home.html', {
//     catalogs: catalogs,
//     total: total
//   });
// })
//
// app.get('/about', function(req, res) {
//   res.render('about.htmlion(req, res) {
//   const catalogs = model.catalog.query();
//   const total = catalogs.length;
//   res.render('search.html', {
//     catalogs: catalogs,
//     total: total
//   });
// });
//
// app.get('/add', function(req, res) {
//   res.render('portals/add.html');
// });
//
// app.get('/catalog/:id', function(req, res) {
//   res.redirect(301, '/portal/' + req.params.id);
// });
//
// app.get('/portal/:id', function(req, res) {
//   const id = req.params.id;
//   const thiscatalog = model.catalog.get(id)
//   if (!thiscatalog) {
//     res.send(404, 'Not Found');
//   } else {
//     res.render('catalog.html', {
//       catalog: thiscatalog
//     });
//   }
// });
//
// app.get('/group/:id', function(req, res) {
//   const id = req.params.id;
//   const catalogs = model.catalog.getGroup(id)
//   res.render('group.html', {
//     group: id,
//     catalogs: catalogs,
//     total: catalogs.length
//   });
// });
//
// app.get('/api/data.json', function(req, res) {
//   res.json(model.catalog._cache);
// });
//
// app.get('/api/catalogs/:id', function(req, res) {
//   const id = req.params.id;
//   const c = model.catalog.get(id);
//   console.log(c)
//   if (!c) {
//     res.send(404, 'Not Found');
//   }
//   res.header("Content-Type", "application/json; charset=utf-8");
//   res.write(JSON.stringify(c));
//   res.end();
// });
//
// app.get('/api/catalogs', function(req, res) {
//   const catalogs = model.catalog.query();
//
//   res.header("Content-Type", "application/json; charset=utf-8");
//   res.write(JSON.stringify(catalogs));
//   res.end();
// });
//
// app.get('/api/groups', function(req, res) {
//   const groups = model.catalog.getGroups();
//
//   res.header("Content-Type", "application/json; charset=utf-8");
//   res.write(JSON.stringify(groups));
//   res.end();
// });
//
// app.get('/admin/reload', routes.reload);
//
// model.catalog.loadUrl(config.databaseUrl, function(err) {
//   if (err) {
//     console.error('Failed to load dataset info', err);
//   }
// });

module.exports = app;
