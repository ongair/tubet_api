var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var gameSchema = new Schema({
  matchCode: String,
  gameId: String,
  homeTeam: String,
  awayTeam: String,
  date: Date
});

module.exports = mongoose.model('Game', gameSchema);
