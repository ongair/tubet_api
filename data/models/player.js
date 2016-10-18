var mongoose = require('mongoose');
var Bet = require('./bet.js');
// var notify = require('../../util/notification.js');
var replies = require('../../behaviours/replies.js');
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
  betUpdates: Boolean,
  level: String,
  levelTutorial: Boolean
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
};

playerSchema.methods.allBets = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    Bet.find({ playerId: self.contactId }, function(err, bets) {
      resolve(bets);
    })
  });
}

playerSchema.methods.progress = function() {
  var self = this;
  return new new Promise(function(resolve, reject) {
    switch (self.level) {
      case "0":
        // progress the user to level 1
        self.level = "1";
        self.save();
        // notify.send(self, replies.texts.leveledUp.replace(/{{level}}/i, "1"));
        break;
      case "1":
        // progress the user to level 1

        self.settledBets()
          .then(function(bets) {
            if (bets.length >= 3) {
              // only move to level two if there are at least 3 bets
              self.level = "2";
              self.save();
              // notify.send(self, replies.texts.leveledUp.replace(/{{level}}/i, "2"));
            }
          })

        break;
      default:

    }
  });
}


playerSchema.methods.settledBets = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    Bet.find({ playerId: self.contactId, state: 'settled' }, function(err, bets) {
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

playerSchema.methods.tubets = function() {
  return (this.credits === undefined || this.credits === null) ? 0 : this.credits;
}

SOURCE_TELEGRAM = 'Telegram';
SOURCE_MESSENGER = 'MessengerV2';

module.exports = mongoose.model('Player', playerSchema);
