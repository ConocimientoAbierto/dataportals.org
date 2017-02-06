'use strict';

const express = require('express');
const passport = require('passport');
const userCtrl = require('./../controllers/users');
const mids = require('./../middlewheres/index');
const validator = require('./../middlewheres/formValidator');

let router = express.Router();

router.get('/', mids.isLoggedIn, mids.roleAuthorization(['admin']), userCtrl.renderAllUsersView);
router.post('/', mids.isLoggedIn, mids.roleAuthorization(['admin']), validator.validateUserForm, userCtrl.createUser);

router.get('/new', mids.isLoggedIn, mids.roleAuthorization(['admin']), userCtrl.renderNewView);

router.get('/login', mids.isNotLogged, userCtrl.renderLoginView);
router.post('/login', mids.isNotLogged, passport.authenticate('local-login', {
  successRedirect: '/portals',
  failureRedirect: '/users/login',
  failureFlash : true
}));

router.get('/logout', mids.isLoggedIn, userCtrl.logoutUser);

router.get('/:id', mids.isLoggedIn, mids.isItselfOrAdmin, userCtrl.renderUserView);
router.put('/:id', mids.isLoggedIn, mids.isItselfOrAdmin, validator.validateUserForm, userCtrl.updateUser);
router.delete('/:id', mids.isLoggedIn, mids.roleAuthorization(['admin']), userCtrl.deleteUser);

router.get('/:id/edit', mids.isLoggedIn, mids.isItselfOrAdmin, userCtrl.renderEditView);

module.exports = router;
