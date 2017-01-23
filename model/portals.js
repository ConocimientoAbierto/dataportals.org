'use strict'

const mongoose = require('mongoose'),
      slugHero = require('mongoose-slug-hero');
// plugin ES6 promises default -> mpromise is deprecated
mongoose.Promise = require('bluebird');

const Schema = mongoose.Schema;

let portalSchema = new Schema({
  slug: String,
  title: {type: String, required: true},
  url: String,
  author: String,
  publisher_clasification: {
    type: String,
    enum: ['municipal government', 'national government', 'ministry', 'org']
  },
  description: {type: String, min: 10, max: 200},
  localization: String,
  country: String,
  city: String,
  lenguage: String,
  status: {
    type: String,
    enum: ['active', 'inactive']
  },
  plataform: {
    type: String,
    enum: ['CKAN', 'JUNAR', 'Own implementation']
  },
  api_endpoint: String,
  api_type: {
    type: String,
    enum: ['CKAN_API_V1', 'CKAN_API_V2', 'CKAN_API_V3', 'JUNAR_API', 'Own implementation', 'No API']
  },
  // user_created: Schema.Types.ObjectId,
  // user_updated: Schema.Types.ObjectId,
},
{
  timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
});

portalSchema.plugin(slugHero, {doc: 'portal', field: 'title'});

module.exports = mongoose.model('Portal', portalSchema);
