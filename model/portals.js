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
  eval_use: {
    oficial_identity: Number,
    link_oficial_site: Number,
    open_data_exp: Number,
    all_dataset_link: Number,
    dataset_search_system: Number,
    examinator: Number
  },
  eval_uses_easiness: {
    existence_api: Number,
    api_documentation: Number
  },
  manaul_evaluation_done: {
    type: Boolean,
    default: false
  },
  automatic_evaluation_done: {
    type: Boolean,
    default: false
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  to_evaluate: {
    type: Boolean,
    required: true
  }
  // user_created: Schema.Types.ObjectId,
  // user_updated: Schema.Types.ObjectId,
}, {
  timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
});

portalSchema.plugin(slugHero, {doc: 'portal', field: 'title'});

module.exports = mongoose.model('Portal', portalSchema);
