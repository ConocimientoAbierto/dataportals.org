'use strict';

const dbUser = 'calidatos';
const dbPass = 'datoscali';
const dbName = 'calidatos';

module.exports = {
  'dbURL': 'mongodb://'+dbUser+':'+dbPass+'@Localhost:27017/'+dbName,
  'sessionSecret': 'shhestoesunsecreto'
};
