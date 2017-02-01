'use strict';

const mongoose = require('mongoose');
// plugin ES6 promises default -> mpromise is deprecated
mongoose.Promise = require('bluebird');

const Schema = mongoose.Schema;

const plataformSchema = new Schema(){
  cod: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  api: [String]
},  {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('Plataform', plataformSchema);
