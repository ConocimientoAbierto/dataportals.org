'use strict';

const mongoose = require('mongoose');
// plugin ES6 promises default -> mpromise is deprecated
mongoose.Promise = Promise;

const Schema = mongoose.Schema;

const evaluationSchema = new Schema({
  portal_slug: {type: String, required: true, index: true},
  automatic_eval_done: {type: Boolean, default: false},
  manual_eval_done: {type: Boolean, default: false},
  is_finished: {type: Boolean, default: false},
  total_score: {type: Number, default: null},
  ease_portal_navigation_score: {type: Number, default: null},
  ease_portal_navigation_criteria: {
    oficial_identity: Number,
    link_oficial_site: Number,
    open_data_exp: Number,
    all_dataset_link: Number,
    dataset_search_system: Number,
    examinator: Number
  },
  automated_portal_use_score: {type: Number, default: null},
  automated_portal_use_criteria: {
    existence_api: Number,
    api_documentation: Number
  },
  metadata_cuality_score: {type: Number, default: null},
  data_cuality_score: {type: Number, default: null},
  datasets: [{
    name: {type: String, default: null},
    title: {type: String, default: null},
    metadata_score: {type: Number, default: null},
    metadata_criteria: {
      dataset_explanation: {type: Number, default: null},
      responsable: {type: Number, default: null},
      update_frequency: {type: Number, default: null},
      actual_update_frequency: {type: Number, default: null},
      licence: {type: Number, default: null},
      format: {type: Number, default: null}
    },
    resources_score: {type: Number, default: null},
    resources_count: {type: Number, default: null},
    resources: [{
      name: {type: String, default: null},
      url: {type: String, default: null},
      file_name: {type: String, default: null},
      evaluable: {type: Boolean, default: false},
      format: {type: String, default: null},
      validity: {type: Number, default: null},
      errors_count: {type: Number, default: null},
      goodtables: {type: Boolean, default: false}
    }]
  }]
}, {
  timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
});

module.exports = mongoose.model('Evaluation', evaluationSchema);
