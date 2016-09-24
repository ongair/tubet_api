var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var betSchema = new Schema({
  playerId: String,
  gameId: String,
  betType: String,
  text: String,
  state: String,
  amount: Number
});

betSchema.methods.getOutcomeFromScore = function(score) {
  points = score.split("-");
  home = points[0];
  away = points[1];

  if (home > away)
    return 'h';
  else if (away > home)
    return 'a';
  else
    return 'x';
}

betSchema.methods.isWinningBet = function(score) {
  outcome = this.getOutcomeFromScore(score);
  return outcome == betType;
}

betSchema.methods.winnings = function(outcome) {
  var self = this;
  return new Promise(function(resolve, reject) {
    Game.findOne({ gameId: self.gameId }, function(err, game) {

    });
  });
}

module.exports = mongoose.model('Bet', betSchema);
