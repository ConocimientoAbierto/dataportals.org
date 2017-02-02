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
 * @param  Array  roles   Authorized roles
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

/**
 * Its check if the user that request access to a route about a user is the looking
 * for itself data or is and admin
 * @param  number  userId  mongo _id for user
 * @param  String  message optional menssage to error
 */
exports.isItselfOrAdmin = (rec, res, next, message) => {
  return (req, res, next) => {
    const user = req.user;

    User.findById(userId, (err, foundUser) => {
      if (err) return res.status(500).send(err.message);

      // check if user that request this route is the same user
      if (user._id === foundUser._id) next();
      // check if user that request is admin
      if (foundUser.role === 'admin') next();

      // the user thar request this route has not auth
      const msg = message ? message : 'No posees autorización par esta sección.';
      req.flash('message', ['warning', msg]);
      res.redirect('back');
    });
  };
};
