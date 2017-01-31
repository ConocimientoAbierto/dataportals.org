'use strict';

/**
 * Render Home View
 */
exports.renderHome = (req, res) => {
  res.render('index.html');
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
exports.sendContactMail = (req, res) => {
  // TODO
  res.send('Terminar esta ruta de envio de mail');
};
