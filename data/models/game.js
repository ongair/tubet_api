var mongoose = require('mongoose');
var replies = require('../../behaviours/replies.js');
var Schema = mongoose.Schema;

var gameSchema = new Schema({
  matchCode: String,
  gameId: String,
  homeTeam: String,
  awayTeam: String,
  homeOdds: Number,
  awayOdds: Number,
  drawOdds: Number,
  status: String,
  result: String,
  date: Date,
  tracker: String,
  betable: Boolean
});

gameSchema.methods.asOption = function() {
  return replies.shortTeamNames[this.homeTeam].toUpperCase() + "-" + replies.shortTeamNames[this.awayTeam].toUpperCase();
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
  str += replies.teams[this.awayTeam] + " Win - (" + this.homeOdds + ")\r\n";
  str += "Draw - (" + this.drawOdds + ")\r\n";
  return str;
}

gameSchema.methods.betOptions = function() {
  return replies.teams[this.homeTeam] + ",Draw," + replies.teams[this.awayTeam];
}



module.exports = mongoose.model('Game', gameSchema);
