'use strict';

const dbUser = 'yourDataBaseName';
const dbPass = 'yourUser';
const dbName = 'yourPass';
const sessionSecret = 'yourUltraSecretForSession';

module.exports = {
  'dbURL': 'mongodb://'+dbUser+':'+dbPass+'@Localhost:27017/'+dbName,
  'sessionSecret': sessionSecret,
  'mailUser': '',
  'mailApiKey': '',
  'mailDomain': '',
  'mailContact': ''
};
