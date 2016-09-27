var mongoose = require('mongoose');
var replies = require('../../behaviours/replies.js');
var Bet = require('./bet.js');
var moment = require('moment');
var notify = require('../../util/notification.js');
var Schema = mongoose.Schema;

var gameSchema = new Schema({
  matchCode: String,
  gameId: String,
  homeTeam: String,
  awayTeam: String,
  homeOdds: Number,
  awayOdds: Number,
  drawOdds: Number,
  minute: String,
  status: String,
  result: String,
  date: Date,
  tracker: String,
  betable: Boolean,
  featured: Boolean,
  promo: String,
  promoUrl: String
});

gameSchema.methods.asOption = function() {
  return replies.teams[this.homeTeam]['short'] + "-" + replies.teams[this.awayTeam]['short'];
}

gameSchema.methods.getBetOption = function(text) {
  if (text.toLowerCase() == replies.teams[this.homeTeam]['full'].toLowerCase())
    return 'h';
  else if (text.toLowerCase() == replies.teams[this.awayTeam]['full'].toLowerCase())
    return 'a';
  else if (text.toLowerCase() == "draw")
    return 'x';
  else
    return null;
}

gameSchema.methods.notifyPunters = function(type, score, message) {

  console.log("About to notify punters", type, message);

  var self = this;
  return new Promise(function(resolve, reject) {
    Bet.find({ gameId: self.gameId, state: 'live' }, function(err, bets) {
      playerIds = bets.map(function(bet) { return bet.playerId });
      console.log("Notifying", playerIds);
      notify.sendToMany(playerIds, message);
    })
  });
}

gameSchema.methods.score = function() {
  if (this.result)
    return this.result;
  else
    return '0-0';
}

gameSchema.methods.progress = function() {
  var str = "*" + replies.teams[this.homeTeam]['full'] + " vs " + replies.teams[this.awayTeam]['full'] + "*\r\n";

  status = this.status;
  var time = this.minute;
  if (!time)
    time = '';

  if (status == 'live') {
    str += "_In progress: " + time + "_";
  }
  else if (status == 'pending') {
    str += moment(this.date).format('llll');
  }
  else if (status == 'complete') {
    str += "_Complete_";
  }
  str += "\r\n_Score: " + this.score() + "_";
  return str;
}

gameSchema.methods.getPossibleWinnings = function(betOption,amount) {
  switch (betOption) {
    case 'h':
      return Math.ceil(this.homeOdds * amount);
      break;
    case 'a':
      return Math.ceil(this.awayOdds * amount);
      break;
    default:
      return Math.ceil(this.drawOdds * amount);
  }
}

gameSchema.methods.getBetOutcome = function(betOption) {
  switch (betOption) {
    case 'h':
      return replies.teams[this.homeTeam]['full'] + " win";
      break;
    case 'a':
      return replies.teams[this.awayTeam]['full'] + " win";
      break;
    default:
      return "Draw";
  }
}

gameSchema.methods.asBet = function() {
  var str = "*" + replies.teams[this.homeTeam]['full'] + " vs " + replies.teams[this.awayTeam]['full'] + "*";
  str += "\r\n";
  str += replies.teams[this.homeTeam]['full'] + " Win - (" + this.homeOdds + ")\r\n";
  str += replies.teams[this.awayTeam]['full'] + " Win - (" + this.awayOdds + ")\r\n";
  str += "Draw - (" + this.drawOdds + ")\r\n";
  return str;
}

gameSchema.methods.betOptions = function() {
  return replies.teams[this.homeTeam]['full'] + ",Draw," + replies.teams[this.awayTeam]['full'];
}



module.exports = mongoose.model('Game', gameSchema);
