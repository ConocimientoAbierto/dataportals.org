'use strict';

const User = require('./../model/users');

/**
 * Check if the user is actualy logged in
 */
exports.isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next();
  }
  // send a flash msg
  req.flash('message', ['warning', 'Debes ingresar primero']);
  res.redirect('/users/login');
};

/**
 * Check if the user is NOT logged in
 */
exports.isNotLogged = (req, res, next) => {
  if(!req.user) {
    return next();
  }
  // send a flash msg
  req.flash('message', ['warning', 'Ya ha realizado login']);
  res.redirect('/users/'+req.user._id);
};

/**
 * Check if the usesr has permissions to proceed
 * @param  Array roles   Authorized roles
 * @param  String message optional message to error
 */
exports.roleAuthorization = (roles, message) => {
  return (req, res, next) => {
    const user = req.user;

    User.findById(user._id, (err, foundUser) => {
      if(err){
        req.flash('message', ['warning', 'No encontramos tu usuario. Vuelve a loguearte']);
        res.redirect('/users/login');
      }

      // the user has the role
      if(roles.indexOf(foundUser.role) > -1) return next();

      // user without proper role
      const msg = message ? message : 'No posees autorización para esta sección.';
      req.flash('message', ['danger', msg]);
      res.redirect('back');
    });
  };
};
