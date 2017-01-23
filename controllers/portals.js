'use strict'

const mongoose = require('mongoose');
const Portal = mongoose.model('Portal');

exports.findAllPortals = (req, res) => {
  Portal.find((err, portals) => {
    if(err) res.send(500, err.message);

    console.log('GET /portals')
    res.status(200).jsonp(portals);
  });
};

//GET - Return a Portal with specified ID
exports.findBySlug = (req, res) => {
  console.log(req.params.slug);
  Portal.findBySlug(req.params.slug, (err, portal) => {
    if(err) return res.send(500, err.message);

    console.log('GET /portal/' + req.params.sulg);
    res.status(200).jsonp(portal);
  });
};

//POST - Insert a new Portal in the DB
exports.addPortal = (req, res) => {
  console.log('POST');
  console.log(req.body);

  var portal = new Portal({
    title                   : req.body.title,
    url                     : req.body.url,
    author                  : req.body.author,
    publisher_clasification : req.body.publisher_clasification,
    description             : req.body.description,
    localizatio             : req.body.localizatio,
    country                 : req.body.country,
    cit                     : req.body.cit,
    lenguage                : req.body.lenguage,
    status                  : req.body.status,
    plataform               : req.body.plataform,
    api_endpoint            : req.body.api_endpoint,
    api_type                : req.body.api_type
  });

  portal.save((err, portal) => {
    if(err) return res.send(500, err.message);
    res.status(200).jsonp(portal);
  });
};

//PUT - Update a register already exists
exports.updatePortal = (req, res) => {
  Portal.findBySlug(req.params.slug, (err, portal) => {
    portal.title = req.body.title ? req.body.title : portal.title;
    portal.url                     = req.body.url;
    portal.author                  = req.body.author;
    portal.publisher_clasification = req.body.publisher_clasification;
    portal.description             = req.body.description;
    portal.localizatio             = req.body.localizatio;
    portal.country                 = req.body.country;
    portal.cit                     = req.body.cit;
    portal.lenguage                = req.body.lenguage;
    portal.status                  = req.body.status;
    portal.plataform               = req.body.plataform;
    portal.api_endpoint            = req.body.api_endpoint;
    portal.api_type                = req.body.api_type;

    portal.save((err) => {
      if(err) return res.send(500, err.message);
      res.status(200).jsonp(portal);
    });
  });
};

//DELETE - Delete a Portal with specified ID
exports.deletePortal = (req, res) => {
  Portal.findBySlug(req.params.slug, (err, portal) => {
    portal.remove((err) => {
      if(err) return res.send(500, err.message);
      res.status(200);
    });
  });
};
