'use strict';

const download = require('download');
const fs = require('fs');
const exec = require('child_process').exec;

module.exports = (input, done) => {
  console.log(input);
  done('*********************** Otro hilo terminado!!!!')
};

process.on('message', portalObj=> {
  // recorrer cada datasets
  const newPortalObj = portalObj.datasets_list.results.reduce( (datasetList, dataset, index) => {
    const resourcesReportArray = dataset.resources.reduce( (resourcesEval, resource) => {
      // descargar cada recurso
      download(resource.url, 'temp')
      .then( () => console.log('descargado file: ' + resource.name) )
      .then( () => getResourceFileName(resource.url) )
      .then( (resourceFileName) => evalWithGoodTables(resourceFileName) )
      .then( goodTableOutput => {
        console.log(goodTableOutput);
      })
      // .then( goodTableResult =>{
      //   return {
      //       name: resource.name,
      //       url: resource.url,
      //       evaluable: resource.format.toLowerCase() === 'csv',
      //       format: resource.format.toLowerCase(),
      //       validity: goodTableResult.success,
      //       errors_count: goodTableResult.report.meta.results.length,
      //     };
      // })
      // // guardar resultado en un array de mismo indice que los datasets
      // .then( resourceEval => {
      //   // borrar recurso
      //
      //   // passing the eval
      //   return resourceEval;
      // })
      // .then( resourceEval => resourcesEval.push(resourceEval))
      // .then( resourcesEval => resourcesEval)
      .catch( err => console.log('child process err: ', err));
    }, []);

    // portalObj.report.datasets[index].resources.push(resourcesReport);
    //
    // return portalObj;
  }, {});
  // guardad en DB
});

const getResourceFileName = (url) => {
  const resourceFileName = url.split('/');
  return resourceFileName[resourceFileName.length - 1];
};

const evalWithGoodTables = (resourceFileName) => {
  const filePath = './temp/' + resourceFileName;
  // evaluar cada recurso
  return new Promise( (resolve, reject) => {
    exec('goodtables --json table ' + filePath, (err, stdout, stderr) => {
      if (err) reject(err);
      // if (stderr) reject(stderr);
      resolve(stdout);
    });
  });
};
