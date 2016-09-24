var mongoose = require('mongoose');
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

module.exports = mongoose.model('Game', gameSchema);
