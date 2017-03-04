'use strict';

const mongoose = require('mongoose');
const configAPP = require('../lib/configAPP');
mongoose.connect(configAPP.dbURL, (err) => err ? console.log(err) : console.log('Conected to DB'));

const request = require('request');
const path = require('path');
const fs = require('fs');
const execSync = require('child_process').execSync;
const Pool = require('threads').Pool;

require('./../model/evaluation');
require('./../model/portals');
require('./../model/ranking');

const Evaluation = mongoose.model('Evaluation');
const Ranking = mongoose.model('Ranking');
const Portal = mongoose.model('Portal');

process.on('message', portals => {
  const portalsArr = portals.portals;
  // get all portal's slugs
  const portalsSlug = portalsArr.map(portal => portal.slug);

  _openRanking(portalsArr).then(function(ranking){
    portalsArr.reduce((portals_promise, portal) => {
      if (portal.to_evaluate === true) {
        console.log("Evaluating ",portal.slug);
        return portals_promise
          .then( () => _setPortalObject(portal))
          .then(portalObj => _getPortalWithDatasetsList(portalObj, 'package_search?rows='))
          .then(portalObj => _checkForPreviousManualEvaluation(portalObj))
          .then(portalObj => _downloadResources(portalObj))
          .then(portalObj => _evaluateDatasets(portalObj))
          .then(portalObj => {
            portalObj.report.ranking_id = ranking._id;
            return portalObj.report.save();
          })
          .then(() => console.log('guardada evaluación de ' + portal.slug))
          .catch((err) => {
            console.log('no se generó la evaluación automática de '+ portal.slug +': \n', err);
            const evaluation = new Evaluation({
              portal_slug: portal.slug,
              ranking_id: ranking._id,
              automatic_eval_done: false,
              manual_eval_done: false,
              is_finished: true,
              with_error: true
            });

            return evaluation.save();
          });
      }
      else {
        console.log("Not evaluating ",portal.slug);
        const evaluation = new Evaluation();
        evaluation.portal_slug = portal.slug;
        evaluation.ranking_id = ranking._id;
        evaluation.save();

        return portals_promise;
      }
    }, Promise.resolve())
    .then( () => {
      console.log('All portals evaluated.');
      _closeRanking(ranking);
    });
  });

});

const _openRanking = portalsArr => {
  //Crear una nueva entrada en la tabla rankings para que se defina created_at y la cantidad de portales a evaluar
  // devolver el ID del ranking para asignar las evaluaciones a este
  const ranking = new Ranking();
  ranking.portals_count = portalsArr.length;
  // ranking.save(function(err,saved_ranking) {
  //     return saved_ranking;
  // });
  return ranking.save();
}

const _closeRanking = ranking => {
  //Traer todas las evaluaciones de este ranking
  //Calcular posiciones
  //Guardar portales en ranking
  //Marcar como finished

  console.log("Starting ranking",ranking._id);

  Evaluation.find({ ranking_id: ranking._id }, function (err,evaluations) {
    console.log("Found evaluations for ranking ",evaluations.length);

    Ranking.find({}, null,  {sort:{_id:-1}, limit:2}, function(err, rankings) {
      // chek for previous ranking
      let previous_ranking = rankings[0];
      if (rankings.length > 1) {
        previous_ranking = rankings[1];
        console.log("Found previous_ranking",previous_ranking._id,previous_ranking.created_at);
      }

      evaluations = evaluations.sort(function(a,b){
        if (a.total_score > b.total_score)
          return -1;
        if (a.total_score < b.total_score)
          return 1;
        return 0;
      });

      console.log(1,evaluations);
      Portal.find({}, (err, portals) => {
        console.log('****1 portales');
        if (err) console.log(err);
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
            return;
          }

          // for portals with evaluation
          const portalEvaluation = evaluations.filter(evaluation => evaluation.portal_slug === portal.slug)[0];

          let prev_pos = null;
          console.log("previous_ranking",previous_ranking);
          for (let p in previous_ranking.portals) {
            if (previous_ranking.portals[p].portal_slug == portalEvaluation.portal_slug) {
              prev_pos = previous_ranking.portals[p].current_position
            }
          }
          console.log("evaluation.portal_slug",portalEvaluation.portal_slug);

          ranking.portals.addToSet({
            portal_slug: portalEvaluation.portal_slug,
            portal_name: portal.title,
            current_position: evaluations.indexOf(portalEvaluation)+1,
            previous_position: prev_pos,
            score: portalEvaluation.total_score,
            was_evaluated: true,
            has_manual_evaluation: portalEvaluation.manual_eval_done,
          });

        });
        ranking.datasets_count = evaluations.reduce((total, evaluation) => {
          return total + evaluation.datasets.length
        }, 0);
        ranking.resources_count = evaluations.reduce((total, evaluation) => {
          return total + evaluation.resources_count
        }, 0);

        ranking.is_finished = true;
        ranking.save((err,ranking) => {
          console.log("finish ranking",err,ranking);
          console.log('terminó el ranking');
        });
      });
      //******
      //forma anterior // TODO BORRAR
      //******
      // evaluations.forEach(function(evaluation,index,all) {
      //   let prev_pos = null;
      //   console.log("previous_ranking",previous_ranking);
      //   for (let p in previous_ranking.portals) {
      //     if (previous_ranking.portals[p].portal_slug == evaluation.portal_slug) {
      //       prev_pos = previous_ranking.portals[p].current_position
      //     }
      //   }
      //   console.log("evaluation.portal_slug",evaluation.portal_slug);
      //
      //   let portal_name = null;
      //   Portal.findBySlug(evaluation.portal_slug, function(err,portal) {
      //     console.log("portal",portal);
      //     portal_name = portal.title;
      //     console.log("Found portal name",portal_name);
      //
      //     ranking.portals.addToSet({
      //       portal_slug: evaluation.portal_slug,
      //       portal_name: portal_name,
      //       current_position: (index+1),
      //       previous_position: prev_pos,
      //       score: evaluation.total_score,
      //       was_evaluated: true,
      //       has_manual_evaluation: evaluation.manual_eval_done,
      //     });
      //
      //     ranking.datasets_count += +evaluation.datasets.length;
      //     ranking.resources_count += +evaluation.resources_count;
      //
      //
      //     Portal.find({to_evaluate: false}, (err, portals) => {
      //       portals.forEach((portal) => {
      //         ranking.portals.addToSet({
      //           portal_slug: portal.slug,
      //           portal_name: portal.title,
      //           current_position: null,
      //           previous_position: null,
      //           score: null,
      //           was_evaluated: false,
      //           has_manual_evaluation: false,
      //         });
      //       });
      //       ranking.is_finished = true;
      //       ranking.save(function(err,ranking) {
      //         console.log("finish ranking",err,ranking);
      //         console.log('terminó el ranking');
      //       });
      //     });
      //   });
      // });
    });
  });
};

const _checkForPreviousManualEvaluation = portalObj => {
  // verify if the automatic evaluation is needed
  return Evaluation.find({portal_slug: portalObj.portal_slug, manual_eval_done: true}).sort({_id: -1}).exec()
  .then(evaluations => {
    const newPortalObj = new Object(portalObj);
    if (evaluations.length > 0) { // has a previous evaluation manual
      newPortalObj.report = evaluations[0];
    }
    return newPortalObj;
  });
};

// download
const _downloadResources = portalObj => {
  return new Promise((resolve, reject) => {
    const resources = [];
    portalObj.datasets_list.results.forEach(dataset => {
      dataset.resources.forEach(resource => {
        if (resource.format.toLowerCase() === 'csv') {
          resources.push(resource);
        }
      });
    });

    // download pool
    const pool = new Pool();
    resources.forEach(resource => {
      // forces http due the sownload lib don't support https
      const fileName = _getResourceFileName(resource.url);
      const filepath = path.join(__dirname, '../temp/', fileName);
      const fileLastModified = resource.last_modified;

      pool.run( (input, done) => {
        'use strict';
        const path = require('path');
        const request = require('request');
        const fs = require('fs');
        const maxSize = 1200000;

        try {
          // if already downloaded don't download again
          if (fs.existsSync(input.filePath) ) {
            const stats = fs.statSync(input.filePath);
            const downloadDate = Date.parse(stats.birthtime);
            const modifiedDate = Date.parse(input.fileLastModified);
            if (downloadDate > modifiedDate) {
              console.log('No se descargará -> ', input.filePath);
              done();
            }
          }
          request({url: input.fileUrl, method: 'HEAD', timeout: 5000}, (err, headRes) => {
            let size = headRes.headers['content-length'];
            if (size > maxSize) {
              console.log('Resource size exceeds limit (' + size + ')');
              done();
            } else {
              // download the file
              let file = fs.createWriteStream(input.filePath);
              let size = 0;
              const req = request({url: input.fileUrl, timeout: 5000});
              req.on('data', function(data) {
                size += data.length;

                if (size > maxSize) {
                  console.log('Resource stream exceeded limit (' + size + ')');
                  req.abort();
                  fs.unlinkSync(input.filePath);
                  done();
                }
              }).pipe(file);
              req.on('request', req => {
                setTimeout(() => {
                  req.abort();
                  done();
                }, 5000);
              });
              req.on('end', () => {
                console.log('descargado -> ', input.filePath);
                done();
              });
              req.on('error', error => {
                throw new Error(error);
              });
            }
          }).on('request', req => {
            setTimeout(() => {
              req.abort();
              done();
            }, 5000);
          })
          .on('end', () => {
            done();
          });
        }
        catch (err) {
          console.log('Error al guardar archivo. \narchivo: ' + input.fileName, err);
          done();
        }
      })
      .send({
        fileUrl: resource.url,
        filePath: filepath,
        fileLastModified: fileLastModified
      });
    });

    pool
    .on('message', (job, message) => console.log(message))
    .on('error', (job, message) => reject('Error en el pool de descarga, error: \n' + message))
    .on('finished', () => {
      console.log('****** Final de descargas del portal ' + portalObj.slug + ' ******');
      resolve(portalObj);
    });
  });
};

const _setPortalObject = portal => {
  let finishUrl = portal.url.slice('/')[portal.url.length -1];
  let apiEndpoint = '';
  let apiPath = '';
  switch (portal.api_type) {
  case 'CKAN_API_V3':
    apiPath = 'api/3/action/';
    apiEndpoint = finishUrl  === '/' ? portal.url + apiPath : portal.url + '/' + apiPath;
    break;
  default:
    break;
  }

  return {
    slug: portal.slug,
    api_endpoint: apiEndpoint
  };
};

const _getPortalWithDatasetsList = (portalObj, query) => {
  const url = portalObj.api_endpoint + query;

  // two request needed to get all datasets. Ckan API limit amount of datasets returned to 10
  return _getDatasetsCount(url+0)
    .then( datasetsCount => _requestPromise(url+datasetsCount, true))
    .then( data => {
      const newPortalObj = {
        portal_slug: portalObj.slug,
        datasets_list: data.result,
        report: new Evaluation()
      };
      newPortalObj.report.portal_slug = portalObj.slug;
      return newPortalObj;
    });
};

const _requestPromise = (url, json) => {
  return new Promise((resolve, reject) => {
    console.log('Making request: '+url);
    request.get({
      url: url,
      json: json || false,
      headers: {'User-Agent': 'request'},
      timeout: 5000
    }, (err, res, data) => {
      if (err) {
        reject('Some thing goes wrong with the request to : ' + url + '\nError: '+ err);
      } else if (res.statusCode !== 200) {
        reject('Request status: ' + res.statusCode);
      }

      // data is already parsed as JSON
      resolve(data);
    });
  });
};

const _getDatasetsCount = apiUrl => {
  return _requestPromise(apiUrl, true)
    .then((data) => data.result.count);
};

/**
 * TODO evaluación de recursos
 */
// const evaluateResources = portalObject => {
//   const Pool = require('threads').Pool;
//
//   const pool = new Pool('_helper.js');
// };
//
const _averageCriteria = criteriaObject => {
  let sum = 0;
  let criteriaCount = 0;

  for (const criteria in criteriaObject) {
    sum += +criteriaObject[criteria];
    criteriaCount++;
  }

  return +(sum / criteriaCount).toFixed(2);
};

const _hasDescription = dataset => {
  return  dataset.notes && dataset.notes.length >= 150 ? 1 : 0;
};

const _hasResponsable = dataset => {
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
};

const _hasUpdateFrequency = datasetExtras => {
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
};

const _hasValidActualUpdateFrecuency = (dataset, updateFrequencyScore) => {
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
};

const _hasValidLicence = license_id => {
  const validLicencesIds = ['odc-pddl', 'odc-odbl', 'odc-by', 'cc-zero', 'cc-by', 'cc-by-sa', 'gfdl'];
  return validLicencesIds.indexOf(license_id.toLowerCase()) === -1 ? 0 : 1;
};

const _hasValidFormat = resources => {
  const validFormats = ['csv', 'json', 'xml', 'geojson', 'kml'];
  return resources.some((resource) => {
    return validFormats.indexOf(resource.format.toLowerCase()) !== -1 ? true : false;
  }) ? 1 : 0; // converting to 1 or 0 if true or false
};
// return the first object of dataset extras array that correspond to one if the searchArray items
// else return false
const _getExtraField = (extras, searchArray) => {

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
};

const _getResourceFileName = url => {
  const resourceFileName = url.split('/');
  return resourceFileName[resourceFileName.length - 1];
};

const _evaluateDatasets = portalObj => {
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
        file_name: fileName,
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
};

const _evalWithGoodTables = filePath => {
  console.log('Evaluando goodtables -> ' + filePath);
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
};
