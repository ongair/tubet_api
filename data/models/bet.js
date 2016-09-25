var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var replies = require('../../behaviours/replies.js');

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

betSchema.methods.status = function(game) {
  status = game.progress();
  switch (this.betType) {
    case 'h':
      status += "\r\nYou bet on a " + replies.teams[game.homeTeam] + " win at " + game.homeOdds;
      break;
    case 'a':
      status += "\r\nYou bet on a " + replies.teams[game.awayTeam] + " win at " + game.awayOdds;
      break;
    default:
      status += "\r\nYou bet on a draw at " + game.drawOdds;
      break;    
  }
  possible = this.winnings(this.betType, game.homeOdds, game.awayOdds, game.drawOdds);
  status += "\r\nPossible win " + possible + "💰 TuBets";
  return status;
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
