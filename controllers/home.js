'use strict';

const config = require('../lib/configAPP');
const mongoose = require('mongoose');
const Ranking = mongoose.model('Ranking');
const Portal = mongoose.model('Portal');
const nodemailer = require('nodemailer');
const xoauth2 = require('xoauth2');

/**
 * Render Home View
 */
exports.renderHome = (req, res) => {
  Ranking.find({is_finished:true}, null,{sort:{_id:-1}, limit:1}, function(err, ranking) {
    console.log(ranking);
    if (err) return res.status(500).send(err.message);
    res.render('index.html', {ranking: ranking[0]});
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
 * Render contacto view
 */
exports.renderContacto = (req, res) => {
  let asunto = null
  if (req.params.portal) {
    asunto = 'Solicito evaluación detallada de '+req.params.portal
  }
  res.render('contacto.html',{asunto: asunto});
};

/**
 * Render Ranking View
 */
exports.renderRanking = (req, res) => {
  // TODO get ranking
  res.render('ranking.html');
};

/**
* Save suggest in db
*/
exports.sendContactMail = (req, res) => {
  // TODO
  // console.log('TODO: Terminar esta ruta de sugerir portal');
  // console.log(req,res);

  const body_text = 'Nombre: ' + req.body.name +
  '\nEmail: ' + req.body.email +
  '\nAsunto: ' + req.body.subject +
  '\nMensaje: ' + req.body.message;

  const data = {
    from: 'Portales de Datos <'+ config.mailUser +'>',
    to: config.mailContact,
    subject: 'Contacto desde portalesdedatos.com.ar',
    text: body_text
  };

  sendMail(data, (err, body) => {
    let msg = ['success', 'Su mensaje ha sido recibido y será revisado en breve.'];

    if (err) {
      console.log(err);
      msg = ['danger', 'Se produjo un error enviando su mensaje. Por favor intente nuevamente.'];
    } else {
      console.log('sent');
    }

    req.flash('message', msg);
    res.redirect('/contacto');
  });
};

/**
 * Send Mail for contact
 */
exports.sendSugerirPortal = (req, res) => {
  // TODO
  // console.log('TODO: Terminar esta ruta de envio de sugerencia de portal');

  const body_text = 'Nombre: ' + req.body.name +
    '\nURL: ' + req.body.url +
    '\nMail: ' + req.body.mail;

  const data = {
    from: 'Portales de Datos <'+ config.mailUser +'>',
    to: config.mailContact,
    subject: 'Sugerir portales en portalesdedatos.com.ar',
    text: body_text
  };

  sendMail(data, (err, body) => {
    let msg = ['success', 'Su mensaje ha sido recibido y será revisado en breve.'];

    if (err) {
      console.log(err);
      msg = ['danger', 'Se produjo un error enviando su mensaje. Por favor intente nuevamente.'];
    } else {
      console.log('sent');
    }

    req.flash('message', msg);
    res.redirect('/sugerir-portal');
  });
};

/**
 * Send mail
 */
const sendMail = (data, cb) => {
  const api_key = config.mailApiKey;
  const domain = config.mailDomain;
  const mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

  mailgun.messages().send(data, cb);
};
