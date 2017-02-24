'use strict';

const mongoose = require('mongoose');
const configAPP = require('../lib/configAPP');
mongoose.connect(configAPP.dbURL, (err) => err ? console.log(err) : console.log('Conected to DB'));

const request = require('request');
const fs = require('fs');
const execSync = require('child_process').execSync;
const Pool = require('threads').Pool;

require('./../model/evaluation');
require('./../model/portals');

const Evaluation = mongoose.model('Evaluation');

process.on('message', portals => {
  const portalsArr = portals.portals;
  // get all portal's slugs
  const portalsSlug = portalsArr.map(portal => portal.slug);

  portalsArr.reduce((portals, portal) => {
    return portals
      .then( () => _setPortalObject(portal))
      .then(portalObj => _getPortalWithDatasetsList(portalObj, 'package_search?rows='))
      .then(portalObj => _checkCurrentAutomaticEvaluation(portalObj))
      .then(portalObj => _downloadResources(portalObj))
      .then(portalObj => _evaluateDatasets(portalObj))
      .then(portalObj => {
        return portalObj.report.save();
      })
      .then(() => console.log('guardada evaluación de ' + portal.slug))
      .catch((err) => console.log('error generando la evaluación automática de '+ portal.slug +': \n', err));
  },
  Promise.resolve()
  ).then( () => {
    console.log('FINAL!');
  });
});

const _checkCurrentAutomaticEvaluation = portalObj => {
  // verify if the automatic evaluation is needed
  return Evaluation.find({portal_slug: portalObj.portal_slug, is_finished: false, }).exec()
  .then(evaluation => {
    if (evaluation.length > 0 && evaluation.automatic_eval_done) { // current automatic evaluation already done
      return Promise.reject('ya hay evaluacion automatica para la actual de ' + portalObj.slug);
    }

    const newPortalObj = new Object(portalObj);
    newPortalObj.report = evaluation[0] ? evaluation[0] : new Evaluation;
    // current evaluation needs automatic evaluation
    newPortalObj.report.portal_slug = portalObj.portal_slug;

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
      const fileName = _getResourceFileName(resource.url);
      pool.run( (input, done) => {
        const path = require('path');
        const download = require('download');
        const fs = require('fs');
        const filePath = input.filePath + input.fileName;

        download(input.fileUrl, {retries: 1})
          .on('request', req => setTimeout(() => req.abort(), 5000)) // abortin after 5" without response
          .on('error', (error, body, response) => {
            console.log(error);
            done();
          })
          .on('response', response => {
            try {
              fs.writeFileSync(filePath, response._readableState.buffer);
            }
            catch(err) {
              console.log('Error al guardar archivo. \narchivo: ' + input.fileName, err);
            }
            done();
          });
      })
      .send({fileUrl: resource.url, filePath: 'temp/', fileName: fileName});
    });

    pool
    .on('message', (job, message) => console.log(message))
    .on('error', (job, message) => reject('Error en el pool de descarga, error: \n' + message))
    .on('finished', () => {
      resolve(portalObj);
    });
  });
};

const _setPortalObject = portal => {
  const finishUrl = portal.api_endpoint.slice('/')[portal.api_endpoint.length -1];
  const api_endpoint = finishUrl  === '/' ? portal.api_endpoint : portal.api_endpoint + '/';

  return {
    slug: portal.slug,
    api_endpoint: api_endpoint + 'action/'
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
        report: {
          portal_slug: portalObj.slug,
          total_score: null, // average of uses_dataset_cuality_score, metadata_score, resource_validity
          metadata_cuality_score: null,
          data_cuality_score: null,
          datasets: []
        }
      };
      return newPortalObj;
    });
};

const _requestPromise = (url, json) => {
  return new Promise((resolve, reject) => {
    request.get({
      url: url,
      json: json || false,
      headers: {'User-Agent': 'request'}
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
      resources_count: dataset.num_resources,
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
        goodtables: null
      };

      if (resourceEval.evaluable) {
        const gtResult = _evalWithGoodTables(resourceEval.file_name);
        if (gtResult.hasOwnProperty('err')) {
          resourceEval.validity = 0;
          resourceEval.errors_count = 0;
          resourceEval.goodtables = false;
        } else {
          resourceEval.validity = gtResult.valid ? 1 : 0;
          resourceEval.errors_count = gtResult['errors-count'];
          resourceEval.goodtables = true;
        }
      }

      validityScore += +resourceEval.validity;

      resources.push(resourceEval);
      return resources;
    }, []);

    datasetEval.resources = resourcesEval;
    datasetEval.resources_score = +(validityScore / datasetEval.resources_count).toFixed(2);
    datasets.push(datasetEval);

    resourceScore += datasetEval.resources_score;
    return datasets;
  }, []);
  portalObj.report.datasets = datasets;

  portalObj.report.metadata_cuality_score = +(metadataSum / datasets.length).toFixed(2);
  portalObj.report.data_cuality_score = +(resourceScore / datasets.length).toFixed(2) ;

  // total score
  const report = portalObj.report;
  const totalCriteria = [
    report.metadata_cuality_score,
    report.data_cuality_score,
    report.ease_portal_navigation_score || 0,
    report.automated_portal_use_score || 0
  ];
  portalObj.report.total_score = _averageCriteria(totalCriteria);
  portalObj.report.automatic_eval_done = true;
  // if manual is already done this eval is finished
  portalObj.report.is_finished = portalObj.report.manual_eval_done || false;

  return portalObj;
};

const _evalWithGoodTables = (resourceFileName) => {
  const filePath = './temp/' + resourceFileName;
  let result = {};

  // evaluar cada recurso
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error({fileNotDownload: 'no se descargó el mensaje'});
    }
    result = execSync('goodtables --json table ' + filePath);
  }
  catch(err) {
    result = {err: 'No se pudo evaluar con goodTable'};
    // if (err.status === 1) {
    //   result = JSON.parse(err.stdout.toString());
    // }
  }

  return result;
};
