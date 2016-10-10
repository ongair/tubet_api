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

betSchema.methods.isWinningBet = function(score) {
  points = score.split("-");
  home = parseInt(points[0]);
  away = parseInt(points[1]);

  switch (this.betType) {
    case 'h':
      return home > away;
      break;
    case 'a':
      return away > home;
      break;
    case 'gg':
      return (home > 0) && (away > 0);
      break;
    case 'ng':
      return home == 0 && away == 0;
      break;
    case 'o':
      return (home + away) >= 3;
      break;
    case 'u':
      return (home + away) < 3;
      break;
    default:
      return home == away;
  }
}

betSchema.methods.statusUpdate = function(game) {
  status = '';
  switch (this.betType) {
    case 'h':
      status += "\r\nYou bet " + this.amount +  " 💰 on a " + replies.teams[game.homeTeam]['full'] + " win at " + game.homeOdds;
      break;
    case 'a':
      status += "\r\nYou bet " + this.amount + " 💰 on a " + replies.teams[game.awayTeam]['full'] + " win at " + game.awayOdds;
      break;
    case 'gg':
      status += "\r\nYou bet " + this.amount + " 💰 that both teams would score at least one goal";
      break;
    case 'ng':
      status += "\r\nYou bet " + this.amount + " 💰 that no goals would be scored";
      break;
    case 'o':
      status += "\r\nYou bet " + this.amount + " 💰 that at least 3 goals would be scored";
      break;
    case 'u':
      status += "\r\nYou bet " + this.amount + " 💰 that less than 3 goals would be scored";
      break;
    default:
      status += "\r\nYou bet " + this.amount + " 💰 on a draw at " + game.drawOdds;
      break;
  }

  possible = game.getPossibleWinnings(this.betType, this.amount);
  if (game.status == 'pending')
    status += "\r\nPossible win " + possible + "💰 TuBets";
  else if (game.status == "live") {
    isWinning = this.isWinningBet(game.score());
    if (isWinning) {
      status += "\r\nYou are on track to win " + possible + "💰 TuBets";
    }
    else {
      status += "\r\nIf things remain the same you will lose " + this.amount + "💰 TuBets";
    }
  }
  return status;
}

betSchema.methods.status = function(game) {
  status = game.progress();
  status += this.statusUpdate(game);
  return status;
}

module.exports = mongoose.model('Bet', betSchema);
