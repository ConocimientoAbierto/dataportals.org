let mongoose = require('mongoose');
let Schema=mongoose.Schema;

let userSchema = new Schema({

});

module.exports = mongoose.model('User', userSchema);
