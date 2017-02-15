'use strict';

const mongoose = require('mongoose');
const request = require('request');
const download = require('download');
const Evaluation = mongoose.model('Evaluation');
const Portal = mongoose.model('Portal');

const setPortalObject = (portal) => {
  return {
    slug: portal.slug,
    url: portal.url
  }
};

const setApiUrl = (url, query) => {
  const api = '/api/3/action/'
  return url + api + query;
};

const requestPromise = (url, json) => {
  return new Promise((resolve, reject) => {
    request.get({
      url: url,
      json: json || false,
      headers: {'User-Agent': 'request'}
      }, (err, res, data) => {
      if (err)
        reject('Some thing goes wrong with the request: ' + err);
      if (res.statusCode !== 200)
        reject('Request status: ' + res.statusCode);

      // data is already parsed as JSON
      resolve(data);
    });
  });
};

const getDatasetsCount = (apiUrl) => {
  return requestPromise(apiUrl, true)
    .then( (data) => data.result.count );
};

const getPortalWithDatasetsList = (portalObj, query) => {
  const url = setApiUrl(portalObj.url, query);
  // two request needed to get all datasets. Ckan API limit amount of datasets returned to 10
  return getDatasetsCount(url+0)
    .then( datasetsCount => requestPromise(url+datasetsCount, true))
    .then( data => {
      const newPortalObj = {
        portal_slug: portalObj.slug,
        datasets_list: data.result,
        report: {
          portal_slug: portalObj.slug,
          total_score: null, // average of uses_dataset_cuality_score, metadata_score, resource_validity
          metadata_cuality_result: null,
          data_cuality_result: null,
          datasets: []
        }
      };
      return newPortalObj;
    });
};

const evaluateDatasets = portalObj => {
  // reduce to a list of datasets
  const datasetList = portalObj.datasets_list.results;

  let metadataSum = 0;

  const datasets = datasetList.reduce( (datasets, dataset) => {
    // Eval report boilerplate
    let datasetEval = {
      name: dataset.name,
      title: dataset.title,
      metadata_result: null, // average metadata_criteria
      metadata_criteria: {
        dataset_explanation: null,
        responsable: null,
        update_frequency: null,
        actual_update_frequency: null,
        licence: null,
        format: null
      },
      resources_result: null,
      resources_count: dataset.num_resources,
      resources: []
    };

    // dataset_uses_easiness_criteria
    datasetEval.metadata_criteria.dataset_explanation = hasDescription(dataset);
    // metadata_criteria
    datasetEval.metadata_criteria.responsable = hasResponsable(dataset);
    datasetEval.metadata_criteria.update_frequency = hasUpdateFrequency(dataset.extras);
    datasetEval.metadata_criteria.actual_update_frequency = hasValidActualUpdateFrecuency(dataset, datasetEval.metadata_criteria.update_frequency);
    datasetEval.metadata_criteria.licence = hasValidLicence(dataset.license_id);
    datasetEval.metadata_criteria.format = hasValidFormat(dataset.resources);

    // average score of each category
    datasetEval.metadata_result = averageCriteria(datasetEval.metadata_criteria);
    datasetEval.resources_result = null;

    metadataSum += +datasetEval.metadata_result;

    // Resources evaluation
    const resourceEval = dataset.resources.reduce( (resources, resource) => {
      let resourceEval = {
        name: resource.name,
        url: resource.url,
        file_name: _getResourceFileName(resource.url),
        evaluable: resource.format.toLocaleLowerCase() === 'csv',
        format: resource.format.toLowerCase(),
        validity: false, // TODO evaluar
        errors_count: null // TODO evaluar
      };
      resources.push(datasetEval);
      return resources;
    }, []);

    datasetEval.resources.push(datasetEval);
    datasets.push(datasetEval);
    return datasets;
  }, []);
  portalObj.report.datasets = datasets

  portalObj.report.metadata_cuality_result = (metadataSum / datasets.length).toFixed(2);
  portalObj.report.total_score = (metadataSum / datasets.length).toFixed(2);
  console.log(metadataSum);
  return portalObj;
};

/**
 * TODO evaluación de recursos
 */
// const evaluateResources = portalObject => {
//   const Pool = require('threads').Pool;
//
//   const pool = new Pool('_helper.js');
// };

const averageCriteria = (criteriaObject) => {
  let sum = 0;
  let criteriaCount = 0;

  for (const criteria in criteriaObject) {
    sum += criteriaObject[criteria];
    criteriaCount++;
  };

  return (sum / criteriaCount).toFixed(2);
};

const hasDescription = (dataset) => {
  return  dataset.notes && dataset.notes.length >= 150 ? 1 : 0;
};

const hasResponsable = (dataset) => {
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

const hasUpdateFrequency = (datasetExtras) => {
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

const hasValidActualUpdateFrecuency = (dataset, updateFrequencyScore) => {
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

const hasValidLicence = (license_id) => {
  const validLicencesIds = ['odc-pddl', 'odc-odbl', 'odc-by', 'cc-zero', 'cc-by', 'cc-by-sa', 'gfdl'];
  return validLicencesIds.indexOf(license_id.toLowerCase()) === -1 ? 0 : 1;
}

const hasValidFormat = (resources) => {
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

const _getResourceFileName = (url) => {
  const resourceFileName = url.split('/');
  return resourceFileName[resourceFileName.length - 1];
};

const saveEvalToDB = portalObj => {
  var portal = new Portal(portalObj.report);


  portal.save((err, portal) => {
    if(err) return res.status(500).send(err.message);
    res.render('portals/view.html', {'portal': portal});
  });
};

exports.makeAutomaticEvaluation = (req, res) => {
  const portalPromise = Portal.findBySlug(req.params.slug).exec();
  portalPromise
    .then( portal => setPortalObject(portal))
    .then( portalObj => getPortalWithDatasetsList(portalObj, 'package_search?rows='))
    .then( portalObj => evaluateDatasets(portalObj))
    .then( portalObj => {
      const evaluation = new Evaluation(portalObj.report);
      evaluation.save( (err, evaluation) => {
        if(err) return res.status(500).send(err);
        console.log('guardado');
        res.redirect('/');
      });
    })
    .catch((err) => console.log('error buscando listado de datasets en '+portal.url+': ', err));
};
