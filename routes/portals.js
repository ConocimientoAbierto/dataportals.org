'use strict';

const express = require('express');
const portalCtrl = require('./../controllers/portals');
const mids = require('../middlewheres/index');
const validator = require('../middlewheres/formValidator');

const evaluationCtrl = require('./../controllers/evaluation');

let router = express.Router();

router.get('/', portalCtrl.findAllPortals);
router.post('/', mids.isLoggedIn, mids.roleAuthorization(['admin']), validator.validatePortalForm, portalCtrl.addPortal);

router.get('/new', mids.isLoggedIn, mids.roleAuthorization(['admin']), portalCtrl.renderNewView);

router.get('/:slug', portalCtrl.findBySlug);
router.put('/:slug', mids.isLoggedIn, mids.roleAuthorization(['admin', 'evaluator']), validator.validatePortalForm, portalCtrl.updatePortal);
router.delete('/:slug', mids.isLoggedIn, mids.roleAuthorization(['admin']), portalCtrl.deletePortal);

router.get('/edit/:slug', mids.isLoggedIn, mids.roleAuthorization(['admin', 'evaluator']), portalCtrl.renderEditView);

router.get('/evaluation/:slug', mids.isLoggedIn, mids.roleAuthorization(['admin', 'evaluator']), portalCtrl.renderEvaluationView);
router.post('/evaluation/:slug', mids.isLoggedIn, mids.roleAuthorization(['admin', 'evaluator']),  portalCtrl.saveManualEvaluationView);

// prueba evaluación
router.get('/evaluation/:slug', evaluationCtrl.makeAutomaticEvaluation);


module.exports = router;
