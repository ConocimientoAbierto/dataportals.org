'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
// plugin ES6 promises default -> mpromise is deprecated
mongoose.Promise = require('bluebird');

const Schema = mongoose.Schema;

// passport-local-mongoose add fields for salt, email(username), and hash
const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    min: 4,
    max: 20
  },
  email: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'evaluator', 'owner'],
    required: true,
  },
  own_portal: {
    type: Boolean,
    default: false
  },
  portals_to_evaluate: [{
    type: Schema.Types.ObjectId,
    ref: 'Portal'
  }]
}, {
  timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
});

// before save always hash pass
userSchema.pre('save', function(next) { // not using => func to preserv 'this' value
  let user = this;
  const salt_factor = 32;

  if(!user.isModified('password')) return next();

  bcrypt.genSalt(salt_factor, (err, salt) => {
    if(err) return next(err);

    bcrypt.hash(user.password, salt, null, (err, hash) => {
      if(err) return next(err);

      user.password = hash;
      next();
    });
  });
});

userSchema.methods.validPassword = (password, hashedPassword) => {
  return bcrypt.compareSync(password, hashedPassword);
};

module.exports = mongoose.model('User', userSchema);
