'use strict';

const express = require('express');
const portalCtrl = require('./../controllers/portals');
const mids = require('../middlewheres/index');
const validator = require('../middlewheres/formValidator');

let router = express.Router();

router.get('/', portalCtrl.findAllPortals);
router.post('/', mids.isLoggedIn, mids.roleAuthorization(['admin']), validator.validatePortalForm, portalCtrl.addPortal);

router.get('/new', mids.isLoggedIn, mids.roleAuthorization(['admin']), portalCtrl.renderNewView);

router.get('/:slug', portalCtrl.findBySlug);
router.put('/:slug', mids.isLoggedIn, mids.roleAuthorization(['admin']), validator.validatePortalForm, portalCtrl.updatePortal);
router.delete('/:slug', mids.isLoggedIn, mids.roleAuthorization(['admin']), portalCtrl.deletePortal);

router.get('/:slug/edit', mids.isLoggedIn, mids.roleAuthorization(['admin']), portalCtrl.renderEditView);

module.exports = router;
