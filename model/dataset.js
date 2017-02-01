'use strict';

const mongoose = require('mongoose');
// plugin ES6 promises default -> mpromise is deprecated
mongoose.Promise = require('bluebird');

const Schema = mongoose.Schema;

const datasetSchema = new Schema(){
  portal_id: {
    type: Schema.Types.ObjectId,
    ref: 'Portal'
  },
  title: {
    type: String,
    required: true
  },
  origin_id: {
    type: String,
    required: true
  },
  eval_uses_easiness: {
    dataset_explanation: Number
  },
  eval_metadata: {
    responsible: Number,
    refresh_date: Number,
    actual_refresh_date: Number,
    licence: Number
  },
  resources: {
    res_id: {
      type: Number,
      required: true
    },
    fotmat: Number,
    validity: Number,
  }
},  {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('Dataset', datasetSchema);
