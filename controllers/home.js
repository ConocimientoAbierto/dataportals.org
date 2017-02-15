'use strict';

const mongoose = require('mongoose');
const Evaluation = mongoose.model('Evaluation');
const Portal = mongoose.model('Portal');

/**
 * Render Home View
 */
exports.renderHome = (req, res) => {
  Evaluation.find({}, (err, evaluations) => {
    if (err) return res.status(500).send(err.message);
    res.render('index.html', {evaluations: evaluations});
  });
};

/**
 * Render metodología view
 */
exports.renderMetodologia = (req, res) => {
  res.render('metodologia.html');
};

/**
 * Render capacitación view
 */
exports.renderCapacitacion = (req, res) => {
  res.render('capacitacion.html');
};

/**
 * Render sugerir portal view
 */
exports.renderSugerirPortal = (req, res) => {
  res.render('sugerir-portal.html');
};

/**
 * Save suggest in db
 */
exports.sendContactMail = (req, res) => {
  // TODO
  console.log('TODO: Terminar esta ruta de sugerir portal');
  res.json(req.body);
};

/**
 * Render contacto view
 */
exports.renderContacto = (req, res) => {
  res.render('contacto.html');
};

/**
 * Render Ranking View
 */
exports.renderRanking = (req, res) => {
  // TODO get ranking
  res.render('ranking.html');
};

/**
 * Send Mail for contact
 */
exports.sendSugerirPortal = (req, res) => {
  // TODO
  console.log('TODO: Terminar esta ruta de envio de sugerencia de portal');
  res.json(req.body);
};
