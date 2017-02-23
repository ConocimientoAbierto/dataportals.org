'use strict';

const mongoose = require('mongoose'),
      slugHero = require('mongoose-slug-hero');
// plugin ES6 promises default -> mpromise is deprecated
mongoose.Promise = Promise;

const Schema = mongoose.Schema;

const portalSchema = new Schema({
  slug: String,
  title: {type: String, required: true},
  url: String,
  author: String,
  publisher_clasification: {
    type: String,
    enum: ['municipal_government', 'national_government', 'ministry', 'org', 'other']
  },
  description: {type: String, min: 10, max: 200},
  country: String,
  city: String,
  lenguage: String,
  status: {
    type: String,
    enum: ['active', 'inactive']
  },
  plataform: {
    type: String,
    enum: ['CKAN', 'JUNAR', 'Own_implementation']
  },
  api_endpoint: String,
  api_type: {
    type: String,
    enum: ['CKAN_API_V1', 'CKAN_API_V2', 'CKAN_API_V3', 'JUNAR_API', 'Own_implementation', 'No_API']
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  to_evaluate: {
    type: Boolean,
    required: true
  }
}, {
  timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
});

portalSchema.plugin(slugHero, {doc: 'portal', field: 'title'});

module.exports = mongoose.model('Portal', portalSchema);
