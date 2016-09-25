var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var betSchema = new Schema({
  playerId: String,
  gameId: String,
  betType: String,
  text: String,
  state: String,
  createdAt: Date,
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
  return outcome == this.betType;
}

betSchema.methods.winnings = function(outcome, homeOdds, awayOdds, drawOdds) {
  amountPlaced = this.amount;
  winnings = 0;
  if (outcome == 'h')
    winnings = amountPlaced * homeOdds;
  else if (outcome == 'a')
    winnings = amountPlaced * awayOdds;
  else
    winnings = amountPlaced * drawOdds;

  winnings = Math.ceil(winnings);
  return winnings;
}

module.exports = mongoose.model('Bet', betSchema);
