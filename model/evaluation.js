'use strict';

const mongoose = require('mongoose');
// plugin ES6 promises default -> mpromise is deprecated
mongoose.Promise = Promise;

const Schema = mongoose.Schema;

const evaluationSchema = new Schema({
  portal_slug: {type: String, required: true, index: true},
  total_score: {type: Number, default: null},
  metadata_cuality_result: {type: Schema.Types.Mixed, default: null},
  data_cuality_result: {type: Number, default: null},
  datasets: [{
    name: {type: String, default: null},
    title: {type: String, default: null},
    metadata_result: {type: Number, default: null},
    metadata_criteria: {
      dataset_explanation: {type: Number, default: null},
      responsable: {type: Number, default: null},
      update_frequency: {type: Number, default: null},
      actual_update_frequency: {type: Number, default: null},
      licence: {type: Number, default: null},
      format: {type: Number, default: null}
    },
    resources_result: {type: Number, default: null},
    resources_count: {type: Number, default: null},
    resources: [{
        name: {type: String, default: null},
        url: {type: String, default: null},
        file_name: {type: String, default: null},
        evaluable: {type: Boolean, default: false},
        format: {type: String, default: null},
        validity: {type: Boolean, default: false},
        errors_count: {type: Number, default: null}
      }]
    }]
}, {
  timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
});

module.exports = mongoose.model('Evaluation', evaluationSchema);
