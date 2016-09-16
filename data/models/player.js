var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var playerSchema = new Schema({
  contactId: String,
  contactName: String,
  handle: String,
  dateRegistered: Date,
  refererId: String
});


module.exports = mongoose.model('Match', matchSchema);
