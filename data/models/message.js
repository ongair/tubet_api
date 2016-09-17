var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var messageSchema = new Schema({
  direction: String,
  contactId: String,
  externalId: String,
  messageType: String,
  text: String,
  sentiment: Number
});

module.exports = mongoose.model('Message', messageSchema);
