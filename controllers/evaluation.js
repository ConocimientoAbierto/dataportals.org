'use strict';

const mongoose = require('mongoose');
const request = require('request');
const child_process = require('child_process');
const Evaluation = mongoose.model('Evaluation');
const Portal = mongoose.model('Portal');

exports.renderNewManualEvaluationView = (req, res) => {
  Portal.findBySlug(req.params.slug)
    .then( foundPortal => {
      const query = {
        portal_slug: foundPortal.slug,
        is_finished: false,
        manual_eval_done: false
      };
      Evaluation.findOne(query).exec()
        .then( foundEval => {
          const data = {
            'portal': foundPortal,
            'evaluation': foundEval
          };

          res.render('evaluations/evaluation.html', data);
        })
        .catch( err => res.status(500).send(err.message));
    })
    .catch( err => res.status(500).send(err.message));
};

exports.getEvaluation = (req, res) => {
  Evaluation.find({portal_slug: req.params.slug}).exec()
    .then(evaluation => res.send(evaluation))
    .catch(err => {
      console.log(err);
      req.flash('message', ['warning', 'Lo sentimos. Tuvimos problemas, por favor intente nuevamente.']);
      return res.redirect('back');
    });
};

exports.saveManualEvaluation = (req, res) => {
  const query = {
    portal_slug: req.params.slug,
    is_finished: false
  };
  const evaluationPromise = Evaluation.findOne(query).exec();

  evaluationPromise
    .then( evaluation => _checkCurrentEvaluation(evaluation) )
    .then( evaluation => _mapRecBodyToEvaluationObj(evaluation) )
    .then( evaluation => evaluation.save() )
    .then( evaluationSaved => {
      let flashMsg = 'Evaluación manual guardada con éxito.';
      req.flash('message', ['warning', flashMsg]);

      res.redirect('/portals/'+ req.params.slug);
    })
    .catch( err => {
      console.log('no encontré la evaluación: ', err);

      let flashMsg = 'Ups! algo salió mal. Por favor vuelve a intentarlo más tarde.';
      // if already is an evaluation in progress and already has manual eval done
      if (err.currentEval) flashMsg = err.currentEval;

      req.flash('message', ['warning', flashMsg]);
      return res.redirect('back');
    });

  // check for the status of the current evaluation
  const _checkCurrentEvaluation = evaluation => {
    if (!evaluation) return new Evaluation(); // no current evaluation

    if (evaluation.manual_eval_done) { // current evaluation manual already done
      const msg = 'Existe una evaluación en proceso y ya posee evaluación manual para ' + req.params.slug;
      return Promise.reject({currentEval: msg});
    }

    return evaluation; // current evaluation needs manual evaluation
  };

  // function to map the data from the form to EvaluationSchema
  const _mapRecBodyToEvaluationObj = evaluation => {
    // general values
    evaluation.portal_slug = evaluation.portal_slug || req.params.slug;
    evaluation.manual_eval_done = true;

    // ease_portal_navigation_criteria
    evaluation.ease_portal_navigation_criteria.oficial_identity = req.body.oficial_identity;
    evaluation.ease_portal_navigation_criteria.link_oficial_site = req.body.link_oficial_site;
    evaluation.ease_portal_navigation_criteria.open_data_exp = req.body.open_data_exp;
    evaluation.ease_portal_navigation_criteria.all_dataset_link = req.body.all_dataset_link;
    evaluation.ease_portal_navigation_criteria.dataset_search_system= req.body.dataset_search_system;
    evaluation.ease_portal_navigation_criteria.examinator = null;
    const epn_criteriaValues = [
      evaluation.ease_portal_navigation_criteria.oficial_identity,
      evaluation.ease_portal_navigation_criteria.link_oficial_site,
      evaluation.ease_portal_navigation_criteria.open_data_exp,
      evaluation.ease_portal_navigation_criteria.all_dataset_link,
      evaluation.ease_portal_navigation_criteria.dataset_search_system,
      //evaluation.ease_portal_navigation_criteria.examinator
    ];
    evaluation.ease_portal_navigation_score = _averageCriteria(epn_criteriaValues);

    // automated_portal_use_criteria
    evaluation.automated_portal_use_criteria.existence_api = req.body.existence_api;
    evaluation.automated_portal_use_criteria.api_documentation = req.body.api_documentation;
    const aps_criteriaValues = [
      req.body.existence_api,
      req.body.api_documentation
    ];
    evaluation.automated_portal_use_score = _averageCriteria(aps_criteriaValues);

    // total score
    const totalCriteria = [
      evaluation.automated_portal_use_score,
      evaluation.ease_portal_navigation_score
    ];
    if (evaluation.automatic_eval_done) {
      totalCriteria.push(evaluation.metadata_cuality_score);
      totalCriteria.push(evaluation.data_cuality_score);
    }

    evaluation.total_score = _averageCriteria(totalCriteria);

    // if automatic is already done this eval is finished
    evaluation.is_finished = evaluation.automatic_eval_done;

    return evaluation;
  };
};

exports.makeAutomaticEvaluation = (req, res) => {
  const portalsPromise = Portal.find({to_evaluate: true, api_type: 'CKAN_API_V3'}).exec();

  portalsPromise
    .then(portals => {
      if (portals.length !== 0)  return portals;

      // if the portals collections is empty
      const msg = 'Sin elementos para evaluar. La base de datos de portales está vasía.';
      return Promise.reject({withOutPortals: msg});
    })
    // start child process
    .then(portals => _startAutomaticEvaluation(portals))
    // return flash message
    .then(() => {
      req.flash('message', ['success', 'La evaluación automática de los portales está en curso']);
      res.send('comenzó');
      // res.redirect('/');
    })
    .catch( err => {
      console.log('Error en la evaluación Automática: ', err);

      let flashMsg = 'Ups! algo salió mal. Por favor vuelve a intentarlo más tarde.';
      // if already is an evaluation in progress and already has manual eval done
      if (err.withOutPortals) flashMsg = err.withOutPortals;

      req.flash('message', ['warning', flashMsg]);
      // return res.redirect('back');
      return res.send(err);
    });

  // make a new thread for the automatic evaluation
  const _startAutomaticEvaluation = portals => {
    // const process = child_process.fork(__dirname + '/_automatic_evaluation.js');
    const process = child_process.fork(__dirname + '/_atomatic_eval-test.js');

    // send portals array
    // process.send({
    //   portals: portals
    // });
  };
};

const saveEvalToDB = portalObj => {
  var portal = new Portal(portalObj.report);


  portal.save((err, portal) => {
    if(err) throw new err(err);
  });
};

const _averageCriteria = criteriaObject => {
  let sum = 0;
  let criteriaCount = 0;

  for (const criteria in criteriaObject) {
    sum += +criteriaObject[criteria];
    criteriaCount++;
  }

  return +(sum / criteriaCount).toFixed(2);
};
