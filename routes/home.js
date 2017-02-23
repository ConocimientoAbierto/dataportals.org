'use strict';

const express = require('express');
const homeCrtl = require('./../controllers/home');
const validator = require('./../middlewheres/formValidator');

const router = express.Router();

// home
router.get('/', homeCrtl.renderHome);

// Metodología
router.get('/metodologia', homeCrtl.renderMetodologia);

// Capacitación
router.get('/capacitacion', homeCrtl.renderCapacitacion);

// Sugerir Portales
router.get('/sugerir-portal', homeCrtl.renderSugerirPortal);
router.post('/sugerir-portal', validator.validateSuggestPortalForm, homeCrtl.sendSugerirPortal);

// Contacto
router.get('/contacto', homeCrtl.renderContacto);
router.post('/contacto', validator.validateContactForm, homeCrtl.sendContactMail);

// Ranking
router.get('/ranking', homeCrtl.renderRanking);

module.exports = router;
