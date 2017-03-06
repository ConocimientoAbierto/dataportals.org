'use strict';

const mongoose = require('mongoose');
const Ranking = mongoose.model('Ranking');
const Portal = mongoose.model('Portal');
const nodemailer = require('nodemailer');

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
    asunto = "Solicito evaluación detallada de "+req.params.portal
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

  let body_text = "Nombre: " + req.body.name +
  "\nEmail: " + req.body.email +
  "\nAsunto: " + req.body.subject +
  "\nMensaje: " + req.body.message;

  sendmail("martin@fcabierto.org","Contacto desde portalesdedatos.com.ar",body_text)
  // res.json(req.body);
  res.render('contacto.html', {enviado: true});
};
/**
 * Send Mail for contact
 */
exports.sendSugerirPortal = (req, res) => {
  // TODO
  // console.log('TODO: Terminar esta ruta de envio de sugerencia de portal');
  let body_text = "Nombre: " + req.body.name +
  "\nURL: " + req.body.url +
  "\nMail: " + req.body.mail;

  sendmail("martin@fcabierto.org","Sugerir portales en portalesdedatos.com.ar",body_text)
  // res.json(req.body);
  res.render('sugerir-portal.html', {enviado: true});
};


function sendmail(destination,subject,body_text) {
  console.log("sendmail",destination,subject,body_text);
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
      // service: 'sendmail',
      // newline: 'unix',
      // path: '/usr/sbin/sendmail'
      service: 'Gmail',
      auth: {
          user: "",
          pass: ""
      }
  });

  // setup email data with unicode symbols
  let mailOptions = {
      from: '"Portales de datos" <info@fcabierto.org>', // sender address
      to: destination, // list of receivers
      subject: subject, // Subject line
      text: body_text
      // , // plain text body
      // html: body_html // html body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log("Mailer error",error);
      }
      console.log('Message %s sent: %s', info.messageId, info.response);
  });
}
