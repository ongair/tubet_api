var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var playerSchema = new Schema({
  contactId: String,
  contactName: String,
  state: String,
  handle: String,
  tutorialAnswer: String,
  dateRegistered: Date,
  termsAccepted: Boolean,
  refererId: String,
  teamId: String,
  source: String,
  credits: Number,
  beta: Boolean,
  betUpdates: Boolean
});


playerSchema.statics.findOneById = function(id) {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.findOne({ contactId: id }, function(err, player) {
      resolve(player);
    });
  });
};

playerSchema.methods.isNew = function() {
  return this.state = 'new';
};

playerSchema.methods.to = function() {
  return this.contactId;
}

SOURCE_TELEGRAM = 'Telegram';
SOURCE_MESSENGER = 'MessengerV2';

module.exports = mongoose.model('Match', playerSchema);
