'use strict';

const express = require('express');
const mids = require('../middlewheres/index');
const evaluationCtrl = require('../controllers/evaluation');

const router = express.Router();

// do the automatic evaluation
// router.get('/automatic_evaluation',mids.isLoggedIn, mids.roleAuthorization['admin'], evaluationCtrl.makeAutomaticEvaluation);
// router.get('/automatic_evaluation', evaluationCtrl.makeAutomaticEvaluation);
router.get('/automatic', evaluationCtrl.makeAutomaticEvaluation);
router.get('/get/:slug', evaluationCtrl.getEvaluation);

// manual evaluation view
// router.get('/manual/:slug', mids.isLoggedIn, mids.roleAuthorization(['admin', 'evaluator']), evaluationCtrl.renderNewManualEvaluationView);
router.get('/manual/:slug', evaluationCtrl.renderNewManualEvaluationView);

// save manual evaluation
// router.post('/manual/:slug', mids.isLoggedIn, mids.roleAuthorization(['admin', 'evaluator']),  evaluationCtrl.saveManualEvaluation);
router.post('/manual/:slug', evaluationCtrl.saveManualEvaluation);

module.exports = router;
