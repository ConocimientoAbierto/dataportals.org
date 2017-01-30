'use strict';

const express = require('express');
const passport = require('passport');
const userCtrl = require('./../controllers/users');
const mids = require('./../middlewheres');

let router = express.Router();

router.get('/', userCtrl.renderAllUsersView);
router.post('/', mids.isLoggedIn, mids.roleAuthorization(['admin']), userCtrl.createUser);

router.get('/new', mids.isLoggedIn, mids.roleAuthorization(['admin']), userCtrl.renderNewView);

router.get('/login', mids.isNotLogged, userCtrl.renderLoginView);
router.post('/login', mids.isNotLogged, passport.authenticate('local-login', {
  successRedirect: '/portals',
  failureRedirect: '/users/login',
  failureFlash : true
}));

router.get('/logout', userCtrl.logoutUser);

router.get('/:id', mids.isLoggedIn, userCtrl.renderUserView);
router.put('/:id', mids.isLoggedIn, userCtrl.updateUser);
router.delete('/:id', mids.isLoggedIn, mids.roleAuthorization(['admin']), userCtrl.deleteUser);

router.get('/:id/edit', mids.isLoggedIn, userCtrl.renderEditView);

module.exports = router;
