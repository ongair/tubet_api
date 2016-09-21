var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var betSchema = new Schema({
  playerId: String,
  gameId: String,
  betType: String,
  text: String,
  amount: Number
});

module.exports = mongoose.model('Bet', betSchema);
