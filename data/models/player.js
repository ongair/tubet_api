var mongoose = require('mongoose');
var Bet = require('./bet.js');
var Schema = mongoose.Schema;

var playerSchema = new Schema({
  contactId: String,
  contactName: String,
  state: String,
  stateData: String,
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

playerSchema.methods.liveBets = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    Bet.find({ playerId: self.contactId, state: 'live' }, function(err, bets) {
      resolve(bets);
    })
  });
}

playerSchema.methods.isNew = function() {
  return this.state = 'new';
};

playerSchema.methods.to = function() {
  return this.contactId;
}

playerSchema.methods.isTelegram = function() {
  return this.source == 'Telegram';
}

playerSchema.methods.isMessenger = function() {
  return !(this.isTelegram);
}

SOURCE_TELEGRAM = 'Telegram';
SOURCE_MESSENGER = 'MessengerV2';

module.exports = mongoose.model('Player', playerSchema);
