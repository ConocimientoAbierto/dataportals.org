'use strict';

const mongoose = require('mongoose');
const configAPP = require('../lib/configAPP');
mongoose.connect(configAPP.dbURL, err => err ? console.log(err) : console.log('Conected to DB'));


const request = require('request');
const path = require('path');
const fs = require('fs-extra');
const execSync = require('child_process').execSync;
const Pool = require('threads').Pool;

require('./../model/evaluation');
require('./../model/portals');
require('./../model/ranking');

const Evaluation = mongoose.model('Evaluation');
const Ranking = mongoose.model('Ranking');
const Portal = mongoose.model('Portal');

// start the evaluation's script
start();

function start () {
  // get all portals
  const portalsPromise = Portal.find().exec();
  portalsPromise
  // start the ranking
  .then(portals => startRanking(portals))
  // evaluate all portal
  .then(rankingObj => evaluateAllPortals(rankingObj))
  // close the ranking
  .then(rankingObj => closeRankign(rankingObj))
  .then(() =>  {
    console.log('==============');
    console.log('Ranking -> done!');
    console.log('==============');
    process.exit(0); // finish the child process
  })
  // catch errors
  .catch((err) => handleErrors(err));
}

/**
 * Save minimun data on the DB santanding out that the ranking is calculating
 */
function startRanking (portals) {
  console.log('* startRanking');

  const ranking = new Ranking();
  ranking.portals_count = portals.length;

  return ranking.save()
    .then((ranking) => {
      // make an object that will be passing through
      const rankingObj = {
        portals: portals,
        ranking: ranking
      };
      return rankingObj;
    })
    .catch((err) => {
      // passing the error to the outter promise chain
      throw new Error(err);
    });
}

/**
 * Evaluate each portal and return an object with all metadata and resources
 * evaluations
 */
function evaluateAllPortals (rankingObj) {
  console.log('* evaluatePortals');
  const portals = rankingObj.portals;

  // reduce to portals than can be evaluated
  const portalPromises = portals
    .filter((portal) => portal.to_evaluate)
    .map((portal) => {
      portal.ranking_id = rankingObj.ranking._id;
      return evaluatePortal(portal);
    });

  // return all evaluations
  return Promise.all(portalPromises)
    .then((portalEvaluations)=> {
      console.log('todas las promesas terminadas');
      return rankingObj;
    });

  function evaluatePortal (portal) {
    return Promise.resolve(portal)
    .then((portal) => _setPortalObject(portal))
    .then((portalObject) => _checkForPreviousManualEvaluation(portalObject))
    .then((portalObject) => _getPortalWithDatasetsList(portalObject))
    .then((portalObject) => _downloadResources(portalObject))
    .then((portalObject) => _evaluateDatasets(portalObject))
    .then((portalObject) => _saveEvaluation(portalObject))
    .then((portalObject) => {
      return portalObject;
    })
    .catch((err) => {
      console.log('*********************************');
      console.log('Error on evaluatePortal');
      console.log(portal.slug);
      console.log(err);
      console.log('*********************************');
    });
  }
}

/**
 * Sort all portals in the ranking
 */
function sortRankign (rankingObj) {
  console.log('* sortRankign');
  // sort all evaluated portals
  // put all non evaluated portals in the end of the ranking
}

/**
 * Close and save to DB the ranking
 */
function closeRankign (rankingObj) {
  console.log('* closeRankign');

  const ranking = rankingObj.ranking;

  return new Promise((resolve, reject) => {
    Evaluation.find({ ranking_id: ranking._id }, function (err, evaluations) {
      console.log('Found evaluations for ranking ',evaluations.length);
      if (err) {
        reject(err);
      }

      Ranking.find({}, null,  {sort:{_id:-1}, limit:2}, function(err, rankings) {
        if (err) {
          reject(err);
        }
        // chek for previous ranking
        let previous_ranking = rankings[0];
        if (rankings.length > 1) {
          previous_ranking = rankings[1];
          console.log('Found previous_ranking',previous_ranking._id,previous_ranking.created_at);
        }

        evaluations = evaluations.sort(function(a, b){
          if (a.total_score > b.total_score)
            return -1;
          if (a.total_score < b.total_score)
            return 1;
          return 0;
        });

        console.log(1,evaluations);
        Portal.find({}, (err, portals) => {
          console.log('****1 portales');
          if (err) {
            reject(err);
          }
          portals.forEach(portal => {
            // this portal is not evaluable
            if (portal.to_evaluate === false) {
              ranking.portals.addToSet({
                portal_slug: portal.slug,
                portal_name: portal.title,
                current_position: null,
                previous_position: null,
                score: null,
                was_evaluated: false,
                has_manual_evaluation: false,
              });
            } else {
              // for portals with evaluation
              const portalEvaluation = evaluations.filter(evaluation => evaluation.portal_slug === portal.slug)[0];

              let prev_pos = null;
              console.log('previous_ranking',previous_ranking);
              for (let p in previous_ranking.portals) {
                if (previous_ranking.portals[p].portal_slug == portalEvaluation.portal_slug) {
                  prev_pos = previous_ranking.portals[p].current_position;
                }
              }
              console.log('evaluation.portal_slug',portalEvaluation.portal_slug);

              ranking.portals.addToSet({
                portal_slug: portalEvaluation.portal_slug,
                portal_name: portal.title,
                current_position: evaluations.indexOf(portalEvaluation)+1,
                previous_position: prev_pos,
                score: portalEvaluation.total_score,
                was_evaluated: true,
                has_manual_evaluation: portalEvaluation.manual_eval_done,
              });
            }
          });

          ranking.datasets_count = evaluations.reduce((total, evaluation) => {
            return total + evaluation.datasets.length;
          }, 0);
          ranking.resources_count = evaluations.reduce((total, evaluation) => {
            return total + evaluation.resources_count;
          }, 0);

          ranking.is_finished = true;
          ranking.save((err, ranking) => {
            if (err) {
              reject(err);
            }
            resolve(ranking);
          });
        });
      });
    });
  });
}

/**
 * handle all errors througth the evaluation
 */
function handleErrors(err) {
  console.log('*****************************************************');
  console.log(err);
  console.log('*****************************************************');
  process.exit(1);
}


/*****************************************************************************
 * HELPERS
 *****************************************************************************/

function _setPortalObject (portal) {
  let finishUrl = portal.url.slice('/')[portal.url.length -1];
  let apiEndpoint = '';
  let apiPath = '';
  let query = '';
  switch (portal.api_type) {
  case 'CKAN_API_V3':
    apiPath = 'api/3/action/';
    apiEndpoint = finishUrl  === '/' ? portal.url + apiPath : portal.url + '/' + apiPath;
    query = 'package_search?rows=';
    break;
  default:
    apiEndpoint = portal.api_endpoint;
    query = '';
    break;
  }

  return {
    ranking_id: portal.ranking_id,
    portal_slug: portal.slug,
    api_endpoint: apiEndpoint,
    query: query
  };
}

function _getPortalWithDatasetsList (portalObj) {
  const url = portalObj.api_endpoint + portalObj.query;

  // two request needed to get all datasets. Ckan API limit amount of datasets returned to 10
  return _getDatasetsCount(url+0)
    .then((datasetsCount) => _requestPromise(url+datasetsCount, false))
    .then((data) => {
      const newPortalObj = new Object(portalObj);
      // check for json validity in the response
      let dataJson = '';
      try {
        dataJson = JSON.parse(data);
        newPortalObj.datasets_list= dataJson.result;
      } catch (err) {
        console.log('Some thing goes wrong getting all dataset from ' + portalObj.portal_slug + '\n' + err);
        newPortalObj.report.with_error = true;
        newPortalObj.report.is_finished = true;
      }
      return newPortalObj;
    });
}

function _requestPromise (url, json) {
  console.log('Making request: '+url);
  let dataJson = '';
  return new Promise((resolve, reject) => {
    request.get({
      url: url,
      headers: {'User-Agent': 'request'},
      timeout: 5000,
      json: json || false,
    }, (err, res, data) => {
      if (err) {
        reject('Some thing goes wrong with the request to : ' + url + '\n'+ err);
      } else if (res.statusCode !== 200) {
        reject('Request status: ' + res.statusCode);
      }
      resolve(data);
    });
  });
}

function _getDatasetsCount (apiUrl) {
  return _requestPromise(apiUrl, true)
    .then((data) => data.result.count);
}

// verify if a manual evaluation is already done and use it
function _checkForPreviousManualEvaluation (portalObj) {
  const options = {
    slug: portalObj.portal_slug,
    manual_eval_done: true
  };
  return Evaluation.find(options).sort({_id: -1}).limit(2).exec()
  .then(evaluations => {
    const newPortalObj = new Object(portalObj);
    // the last manual eval or a new eval.
    newPortalObj.report = evaluations.length > 0 ? evaluations[0] : new Evaluation();
    newPortalObj.report.portal_slug = portalObj.portal_slug;
    return newPortalObj;
  });
}

// download all evaluables resources
function _downloadResources (portalObj) {
  // has error? just pass through
  if (_hasEvaluatedWithError(portalObj.report)) return portalObj;

  // reduce to resurces that we can evaluate
  const formatsToEvaluate = ['csv'];
  const resources = [];
  portalObj.datasets_list.results.forEach((dataset) => {
    dataset.resources.forEach((resource) => {
      if (formatsToEvaluate.indexOf(resource.format.toLowerCase()) !== -1) {
        resource.dataset_name = dataset.name;
        resources.push(resource);
      }
    });
  });

  // download pool
  const pool = new Pool();

  const promisesArray = [];
  resources.forEach(resource => {
    // forces http due the sownload lib don't support https
    const fileName = _getResourceFileName(resource.url);
    const portalSlug = portalObj.portal_slug;
    const datasetName = resource.dataset_name;
    const filePath = path.join(__dirname, '../temp/', portalSlug, datasetName);
    const fileLastModified = resource.last_modified !== null ? resource.last_modified : resource.created;

    // run the worker
    pool.run('controllers/fileDownloader');

    promisesArray.push(pool.send({
      fileUrl: resource.url,
      filePath: filePath,
      fileName: fileName,
      fileLastModified: fileLastModified
    }).promise());
  });

  return Promise.all(promisesArray)
  .then( () => {
    pool.killAll();
    console.log('==========================================================');
    console.log('Download process finished for -> ' + portalObj.portal_slug);
    return portalObj;
  })
  .catch((err) => {
    console.log('==========================================================');
    console.log('ups en download \n' + err);
  });
}

function _getResourceFileName (url) {
  const resourceFileName = url.split('/');
  return resourceFileName[resourceFileName.length - 1];
}

function _evaluateDatasets (portalObj) {
  // reduce to a list of datasets
  const datasetList = portalObj.datasets_list.results;
  let metadataSum = 0;
  let resourceScore = 0;
  let resourcesCount = 0;

  const datasets = datasetList.reduce( (datasets, dataset) => {
    // Eval report boilerplate
    let datasetEval = {
      name: dataset.name,
      title: dataset.title,
      metadata_score: null, // average metadata_criteria
      metadata_criteria: {
        dataset_explanation: null,
        responsable: null,
        update_frequency: null,
        actual_update_frequency: null,
        licence: null,
        format: null
      },
      resources_score: null,
      resources_count: dataset.resources.length,
      resources: []
    };

    // dataset_uses_easiness_criteria
    datasetEval.metadata_criteria.dataset_explanation = _hasDescription(dataset);
    // metadata_criteria
    datasetEval.metadata_criteria.responsable = _hasResponsable(dataset);
    datasetEval.metadata_criteria.update_frequency = _hasUpdateFrequency(dataset.extras);
    datasetEval.metadata_criteria.actual_update_frequency = _hasValidActualUpdateFrecuency(dataset, datasetEval.metadata_criteria.update_frequency);
    datasetEval.metadata_criteria.licence = _hasValidLicence(dataset.license_id);
    datasetEval.metadata_criteria.format = _hasValidFormat(dataset.resources);

    // average score of each category
    datasetEval.metadata_score = _averageCriteria(datasetEval.metadata_criteria);
    datasetEval.resources_score = null;

    metadataSum += +datasetEval.metadata_score;

    let validityScore = 0;
    let validityCount = 0;
    // Resources evaluation
    const resourcesEval = dataset.resources.reduce((resources, resource) => {
      const fileName = _getResourceFileName(resource.url);
      let resourceEval = {
        name: resource.name,
        url: resource.url,
        file_name: path.join(portalObj.portal_slug, dataset.name, fileName),
        evaluable: resource.format.toLocaleLowerCase() === 'csv',
        format: resource.format.toLowerCase(),
        validity: null,
        errors_count: null,
        goodtables: false
      };

      if (resourceEval.evaluable) {
        const filePath = path.join(__dirname, '../temp/', resourceEval.file_name);

        if (fs.existsSync(filePath)) {
          const gtResult = _evalWithGoodTables(filePath);
          if (gtResult.hasOwnProperty('err')) {
            resourceEval.validity = 0;
            resourceEval.errors_count = 0;
            resourceEval.goodtables = false;
          } else {
            resourceEval.validity = gtResult.valid ? 1 : 0;
            resourceEval.errors_count = gtResult['error-count'];
            resourceEval.goodtables = true;
          }
        } else {
          resourceEval.goodtables = false;
        }
      }

      // only evaluables and evaluated resources are taken
      if (resourceEval.evaluable && resourceEval.goodtables) {
        validityScore += +resourceEval.validity;
        validityCount++;
      }

      resources.push(resourceEval);
      return resources;
    }, []);

    datasetEval.resources = resourcesEval;
    // if all resources in dataset aren't evaluables or has validity false
    datasetEval.resources_score = 0;
    if (validityScore > 0 && validityCount > 0) {
      datasetEval.resources_score = +(validityScore / validityCount).toFixed(2);
    }
    datasets.push(datasetEval);

    resourcesCount += +datasetEval.resources_count;
    resourceScore += datasetEval.resources_score;
    return datasets;
  }, []);
  portalObj.report.datasets = datasets;

  portalObj.report.metadata_cuality_score = +(metadataSum / datasets.length).toFixed(2);
  portalObj.report.data_cuality_score = +(resourceScore / datasets.length).toFixed(2);
  portalObj.report.resources_count = +resourcesCount;

  // total score
  const report = portalObj.report;
  const totalCriteria = [
    report.metadata_cuality_score,
    report.data_cuality_score,
  ];
  // if already has a manual evaluation
  if (report.manual_eval_done) {
    totalCriteria.push(report.ease_portal_navigation_score);
    totalCriteria.push(report.automated_portal_use_score);
  }
  portalObj.report.total_score = _averageCriteria(totalCriteria);
  portalObj.report.automatic_eval_done = true;
  portalObj.report.is_finished = true;

  return portalObj;
}

function _averageCriteria (criteriaObject) {
  let sum = 0;
  let criteriaCount = 0;

  for (const criteria in criteriaObject) {
    sum += +criteriaObject[criteria];
    criteriaCount++;
  }

  return +(sum / criteriaCount).toFixed(2);
}

function _hasDescription (dataset) {
  return  dataset.notes && dataset.notes.length >= 150 ? 1 : 0;
}

function _hasResponsable (dataset) {
  let score = 0;
  const res = dataset.maintainer;
  const res_mail = dataset.maintainer_email;
  const author = dataset.author;
  const author_mail = dataset.author_email;
  const email_regex = new RegExp('(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)');

  if ( (res && email_regex.test(res_mail)) || (author && email_regex.test(author_mail)) )
    score = 1;
  else if (res || author)
    score = 0.5;

  return score;
}

function _hasUpdateFrequency (datasetExtras) {
  /* list of possible frecuencies references for DCAT
  continual - R/PT1S
  daily - R/P1D
  weekly - R/P1W
  fortnightly - R/P0.5M
  monthly - R/P1M
  quarterly - R/P3M
  biannually - R/P0.5Y
  asNeeded - irregular
  irregular - irregular
  notPlanned - irregular
  unknown - irregular
   */

  const frecuencyFields = ['frecuency', 'accrualperiodicity'];
  const validFrecuency = ['R/PT1S', 'R/P1D', 'R/P1W', 'R/P0.5M', 'R/P1M', 'R/P3M', 'R/P0.5Y'];

  // check if a valid field is in dataset extra
  const frecuencyField = _getExtraField(datasetExtras, frecuencyFields);

  // check if the the field with a valid key for frecuency has a valid update frecuency
  const hasValidFrecuency = validFrecuency.indexOf(frecuencyField.value);

  // frecuency is not informed = 0 or is informed = 1
  return hasValidFrecuency === -1 ? 0 : 1;
}

function _hasValidActualUpdateFrecuency (dataset, updateFrequencyScore) {
  // if the update frecuency is not informed = 0
  if (updateFrequencyScore === 0) return 0;

  const frecuencyFields = ['frecuency', 'accrualperiodicity'];
  const validFrecuency = {
    'R/PT1S': 1,
    'R/P1D': 2,
    'R/P1W': 7,
    'R/P0.5M': 15,
    'R/P1M': 30,
    'R/P3M': 90,
    'R/P0.5Y': 180
  };
  const frecuencyField = _getExtraField(dataset.extras, frecuencyFields);
  const maxDiff = validFrecuency[frecuencyField.value];

  const daysInMili = 24 * 60 * 60 * 1000;
  const firstDate = Date.now();

  // compare dates
  const secondDate = new Date(dataset.metadata_modified);
  const diff = firstDate - secondDate;
  const daysDiff = Math.floor(diff / daysInMili);

  return daysDiff <= maxDiff ? 1 : 0;
}

function _hasValidLicence (license_id) {
  const validLicencesIds = ['odc-pddl', 'odc-odbl', 'odc-by', 'cc-zero', 'cc-by', 'cc-by-sa', 'gfdl'];
  return validLicencesIds.indexOf(license_id.toLowerCase()) === -1 ? 0 : 1;
}

function _hasValidFormat (resources) {
  const validFormats = ['csv', 'json', 'xml', 'geojson', 'kml'];
  return resources.some((resource) => {
    return validFormats.indexOf(resource.format.toLowerCase()) !== -1 ? true : false;
  }) ? 1 : 0; // converting to 1 or 0 if true or false
}
// return the first object of dataset extras array that correspond to one if the searchArray items
// else return false
function _getExtraField (extras, searchArray) {

  // check if a valid field is in dataset extra
  const foundFields = extras
    .map((field) => field.key)
    .filter((fieldKey) => searchArray.indexOf(fieldKey) === -1 ? false : true);

  // dataset exras fields has not the search field
  if (foundFields.length === 0) return false;

  // get the index of the searched field in the dataset extras array
  const index = extras
    .map((field) => field.key)
    .indexOf(foundFields[0]);

  return extras[index];
}

function _evalWithGoodTables (filePath) {
  // console.log('Evaluando goodtables -> ' + filePath);
  let result = {};

  // evaluar cada recurso
  try {
    const gt = execSync('goodtables --json table ' + filePath);
    result = JSON.parse(gt.toString());
  }
  catch(err) {
    result = {err: 'No se pudo evaluar con goodTable'};
    if (err.status === 1) {
      try {
        result = JSON.parse(err.stdout.toString());
      }
      catch(err) {
        result = {err: 'No se pudo evaluar con goodTable'};
      }
    }
  }

  return result;
}

function _saveEvaluation (portalObject) {
  portalObject.report.ranking_id = portalObject.ranking_id;
  console.log(portalObject);
  console.log('=================================================================');
  return portalObject.report.save();
}

/**
 * return true if the evaluation has an error
 */
function _hasEvaluatedWithError (evaluation) {
  return evaluation.is_finished && evaluation.with_error;
}
