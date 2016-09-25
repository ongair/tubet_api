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
  betable: Boolean
});

gameSchema.methods.asOption = function() {
  return replies.teams[this.homeTeam] + "-" + replies.teams[this.awayTeam];
}

gameSchema.methods.getBetOption = function(text) {
  if (text.toLowerCase() == replies.teams[this.homeTeam].toLowerCase())
    return 'h';
  else if (text.toLowerCase() == replies.teams[this.awayTeam].toLowerCase())
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
  var str = "*" + replies.teams[this.homeTeam] + " vs " + replies.teams[this.awayTeam] + "*\r\n";

  status = this.status;
  if (status == 'live') {
    str += "_In progress: " + this.minute + "_";
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
      return replies.teams[this.homeTeam] + " win";
      break;
    case 'a':
      return replies.teams[this.awayTeam] + " win";
      break;
    default:
      return "Draw";
  }
}

gameSchema.methods.asBet = function() {
  var str = "*" + replies.teams[this.homeTeam] + " vs " + replies.teams[this.awayTeam] + "*";
  str += "\r\n";
  str += replies.teams[this.homeTeam] + " Win - (" + this.homeOdds + ")\r\n";
  str += replies.teams[this.awayTeam] + " Win - (" + this.awayOdds + ")\r\n";
  str += "Draw - (" + this.drawOdds + ")\r\n";
  return str;
}

gameSchema.methods.betOptions = function() {
  return replies.teams[this.homeTeam] + ",Draw," + replies.teams[this.awayTeam];
}



module.exports = mongoose.model('Game', gameSchema);
