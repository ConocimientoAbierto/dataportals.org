'use strict';

const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const User = require('./../model/users');

const passportConfig = (app) => {
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser( (user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser( (id, done) => {
    // populate req.user and prevent send pass in each request
    User.findById(id, {password: 0, email: 0} , (err, user) => {
      done(err, user);
    });
  });

  // user login logic
  passport.use('local-login', new localStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback : true
  },
  (req, email, password, done) => {

    User.findOne({ 'email' :  email }, (err, user) => {
      // if there are any errors, return the error before anything else
      if (err) return done(null, false, req.flash('message', ['danger', err.message]));

      // mmm, user is not there or pass is invalid. return the message
      if (!user || !user.validPassword(password, user.password)) {
        let errMsg = 'No reconocemos el mail o la contraseña. Por favor, vuelve a intentarlo.';
        return done(null, false, req.flash('message', ['warning', errMsg]));
      }

      // all green, return successful user
      return done(null, user, req.flash('message', ['success', 'Bienvenido ' + user.name]));
    });
  }));

};

module.exports = passportConfig;
