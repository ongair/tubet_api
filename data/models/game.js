var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var gameSchema = new Schema({
  matchId: String,
  gameId: String
});

module.exports = mongoose.model('Game', matchSchema);
