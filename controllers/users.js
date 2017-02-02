'use strict';

const mongoose = require('mongoose');
const User = mongoose.model('User');

// GET - render all users view
exports.renderAllUsersView = (req, res) => {
  User.find((err, users) => {
    if (err) return res.status(500).send(err.message);

    res.render('users/index.html', {'users': users});
  });
};

// GET - render single user view
exports.renderUserView = (req, res) => {
  User.findById(req.params.id, (err, user) => {
    if (err) return res.status(500).send(err.message);

    res.render('users/view.html', {'user': user});
  });
};

// POST - create user
exports.createUser = (req, res, next) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const role = req.body.role;

  User.findOne({email: email}, (err, existingUser) => {
    if(err) return next(err);

    // be sure that user is not alredy registered
    if(existingUser) return res.status(422).send({error: 'That email address is already in use'});

    var user = new User({
      name: name,
      email: email,
      password: password,
      role: role
    });

    user.save( (err) => {
      if(err) return next(err);

      res.redirect('/users/login');
    });
  });
};

// PUT - update a user
exports.updateUser = (req, res, next) => {
  User.findByIdAndUpdate(req.params.id, req.body, {new: true}, (err, updatedUser) => {
    if (err) return next(err);

    if (!updatedUser) {
      const msg = 'No es posible encontrar al ususario.';
      req.flash('message', ['warning', msg])
      return res.redirect('/');
    }

    res.locals.user = updatedUser;
    res.render('users/view.html');
  });
};

// DELETE - delete a user
exports.deleteUser = (req, res) => {
  //TODO
};

// GET - render edit view
exports.renderEditView = (req, res) => {
  User.findById(req.params.id, (err, foundUser) => {
    if (err) return res.status(500).send(err.message);

    if (!foundUser) {
      const msg = 'No es posible encontrar al ususario.';
      req.flash('message', ['warning', msg])
      return res.redirect('/');
    }

    res.render('users/edit.html', {'user': user});
  });
};

// GET - render new View
exports.renderNewView = (req, res) => {
  res.render('users/new.html');
};

// GET - render Login view
exports.renderLoginView = (req, res) => {
  res.render('users/login.html');
};

// POST - login logic
exports.logoutUser = (req, res) => {
  req.session.destroy(function(err) {
    if(err) console.log(err);
    else res.redirect('/');
  });
};
