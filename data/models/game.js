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



module.exports = mongoose.model('Game', gameSchema);
