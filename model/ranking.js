'use strict';

const mongoose = require('mongoose');
// plugin ES6 promises default -> mpromise is deprecated
mongoose.Promise = Promise;

const Schema = mongoose.Schema;

const rankingSchema = new Schema({
  portals_count: {type: Number, default: null},
  datasets_count: {type: Number, default: null},
  resources_count: {type: Number, default: null},
  portals: [{
    portal_slug: {type: String, required: true, index: true},
    portal_name: {type: String, required: true},
    current_position:{type: Number, default: null},
    previous_position:{type: Number, default: null},
    score: {type: Number, default: null},
    was_evaluated: {type: Boolean, default: false},
    has_manual_evaluation: {type: Boolean, default: false},
  }],
  is_finished: {type: Boolean, default: false},
}, {
  timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
});

module.exports = mongoose.model('Ranking', rankingSchema);
