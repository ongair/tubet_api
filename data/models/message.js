var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var messageSchema = new Schema({
  direction: String,
  contactId: String,
  externalId: String,
  messageType: String,
  text: String,
  source: String,
  replyTo: String,
  sentiment: Number
});

messageSchema.statics.findOrCreate = function(id, contactId, direction, messageType, text, source) {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.findOne({ externalId: id }, function(err, message) {
      if (!message) {
        message = new Message({ contactId: contactId, externalId: id, messageType: messageType, direction: direction, text: text, source: source });
      }
      resolve(message);
    });
  });
};


module.exports = mongoose.model('Message', messageSchema);
