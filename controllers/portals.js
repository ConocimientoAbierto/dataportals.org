'use strict';

const mongoose = require('mongoose');
const Portal = mongoose.model('Portal');
const userCtrl = require('./../controllers/users');

// GET - return all portlas
exports.findAllPortals = (req, res) => {
  Portal.find((err, portals) => {
    if(err) return res.status(500).send(err.message);

    res.render('portals/index.html', {'portals': portals});
  });
};

// GET - Return a Portal with specified SULG
exports.findBySlug = (req, res) => {
  Portal.findBySlug(req.params.slug, (err, portal) => {
    if(err) return res.status(500).send(err.message);

    res.render('portals/view.html', {'portal': portal});
  });
};

// POST - Insert a new Portal in the DB
exports.addPortal = (req, res) => {
  var portal = new Portal({
    title                   : req.body.title,
    url                     : req.body.url,
    author                  : req.body.author,
    publisher_clasification : req.body.publisher_clasification,
    description             : req.body.description,
    localization            : req.body.localization,
    country                 : req.body.country,
    city                    : req.body.city,
    lenguage                : req.body.lenguage,
    status                  : req.body.status,
    plataform               : req.body.plataform,
    api_endpoint            : req.body.api_endpoint,
    api_type                : req.body.api_type,
  });
  portal.to_evaluate = req.body.to_evaluate === 'on' ? true : false;
  if (req.body.owner) portal.owner = req.body.owner;

  portal.save((err, portal) => {
    if(err) return res.status(500).send(err.message);
    res.render('portals/view.html', {'portal': portal});
  });
};

// PUT - Update a register already exists
exports.updatePortal = (req, res) => {
  Portal.findBySlug(req.params.slug, (err, portal) => {
    portal.title = req.body.title ? req.body.title : portal.title;
    portal.url                     = req.body.url;
    portal.author                  = req.body.author;
    portal.publisher_clasification = req.body.publisher_clasification;
    portal.description             = req.body.description;
    portal.localization            = req.body.localization;
    portal.country                 = req.body.country;
    portal.city                    = req.body.city;
    portal.lenguage                = req.body.lenguage;
    portal.status                  = req.body.status;
    portal.plataform               = req.body.plataform;
    portal.api_endpoint            = req.body.api_endpoint;
    portal.api_type                = req.body.api_type;
    portal.to_evaluate = req.body.to_evaluate === 'on' ? true : false;
    if (req.body.owner) portal.owner = req.body.owner;

    portal.save((err, portal) => {
      if(err) return res.status(500).send(err.message);
      res.redirect('/portals/' + portal.slug);
    });
  });
};

// DELETE - Delete a Portal with specified ID
exports.deletePortal = (req, res) => {
  Portal.findBySlug(req.params.slug, (err, portal) => {
    portal.remove((err) => {
      if(err) return res.status(500).send(err.message);
      res.redirect('/portals');
    });
  });
};

// NEW view
exports.renderNewView = (req, res) => res.render('portals/new.html');

// Edit view
exports.renderEditView = (req, res) => {
  Portal.findBySlug(req.params.slug, (err, portal) => {
    if (err) return res.status(500).send(err.message);

    const ownersCandidates = userCtrl.getFreeOwnerCandidate();
    const data = {
      'portal': portal,
      'ownersCandidates': ownersCandidates
    }
    res.render('portals/edit.html', data);
  });
};

/** EVALUATIONS **/
// GET - Manual Evaluation View
exports.renderEvaluationView = (req, res) => {
  Portal.findBySlug(req.params.slug, (err, portal) => {
    if (err) return res.status(500).send(err.message);

    res.render('portals/evaluation.html', {'portal': portal});
  });
};

// POST - Save Manual Evaluation
exports.saveManualEvaluationView = (req, res) => {
  Portal.findBySlug(req.params.slug, (err, portal) => {
    if (err) return res.status(500).send(err.message);

    portal.eval_use = {
      oficial_identity: req.body.oficial_identity,
      link_oficial_site: req.body.link_oficial_site,
      open_data_exp: req.body.open_data_exp,
      all_dataset_link: req.body.all_dataset_link,
      dataset_search_system: req.body.dataset_search_system
      // examinator: req.body.examinator
    };

    portal.eval_uses_easiness = {
      existence_api: req.body.existence_api,
      api_documentation: req.body.api_documentation
    };

    portal.portal_evaluation = true;

    portal.save((err, portal) => {
      if(err) return res.status(500).send(err.message);
      res.redirect('/portals/' + portal.slug);
    });
  });
};


/** DETAIL **/
// GET - Detail View
exports.renderDetailView = (req, res) => {
  Portal.findBySlug(req.params.slug, (err, portal) => {
    if (err) return res.status(500).send(err.message);

    res.render('portals/view.html', {'portal': portal});
  });
};
