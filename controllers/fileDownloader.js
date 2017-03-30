'use strict';
const path = require('path');
const request = require('request');
const fs = require('fs-extra');
function downloadFile (input, done) {
  const seeConcoleLog = false;
  const maxSize = 1200000;
  const filePath = path.join(input.filePath, input.fileName);

  try {
    // create directories if don't exists
    fs.ensureDirSync(input.filePath);

    // if already downloaded don't download again
    if (fs.existsSync(filePath) ) {
      const stats = fs.statSync(filePath);
      const downloadDate = Date.parse(stats.birthtime);
      const modifiedDate = Date.parse(input.fileLastModified);
      if (downloadDate < modifiedDate) {
        if (seeConcoleLog) console.log('We already have the last version of -> ', filePath);
        done();
      }
    }
    request({url: input.fileUrl, method: 'HEAD'}, (err, headRes) => {
      if (err) {
        if (seeConcoleLog) console.log('request error on file -> ' + filePath, err);
        done();
      }
      let size = headRes.headers['content-length'];
      if (size > maxSize) {
        if (seeConcoleLog) console.log('Resource size exceeds limit (' + size + ') of ', filePath);
        done();
      } else {
        if (seeConcoleLog) console.log('Downloading -> ', filePath);

        // download the file
        let file = fs.createWriteStream(filePath);
        let size = 0;
        const req = request.get({url: input.fileUrl});
        req.on('data', (data) => {
          size += data.length;

          // abort download if the file size is more than the maxSize
          if (size > maxSize) {
            if (seeConcoleLog) console.log('Resource size exceeds limit (' + size + ') of ', filePath);
            req.abort();
            fs.unlinkSync(filePath);
            done();
          }
        })
        .on('error', (error) => {
          if (seeConcoleLog) console.log('request error on file -> ' + filePath, error);
          done();
        }).pipe(file);

        // abort after 5' without finish
        req.on('request', req => {
          setTimeout(() => {
            if (seeConcoleLog) console.log('Timeout Error on file -> ' + filePath);
            req.abort();
            done();
          }, 5000);
        });
      }
    })
    // abort after 5'
    .on('request', req => {
      setTimeout(() => {
        if (seeConcoleLog) console.log('Timeout Error on file -> ' + filePath);
        req.abort();
        done();
      }, 5000);
    })
    .on('error', (error) => {
      if (seeConcoleLog) console.log('request error on file -> ' + filePath, error);
      done();
    });
  }
  catch (err) {
    if (seeConcoleLog) console.log('Failed on saving file -> ' + input.fileName + '/n', err);
    done();
  }
}

module.exports = downloadFile;
