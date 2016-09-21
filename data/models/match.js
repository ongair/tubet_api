// var mongoose = require('mongoose');
// var Schema = mongoose.Schema;
//
// var matchSchema = new Schema({
//   key: String,
//   homeTeamId: String,
//   awayTeamId: String,
//   date: String
// });

// matchSchema.statics.practiceMatch = function() {
//   return {
//     title: 'League Cup - 3rd Round',
//     home: 'Leicester',
//     away: 'Chelsea',
//     date: new Date(2016, 09, 20, 21, 45),
//     odds: { h: 4.03, a: 1.88, x: 3.71 }
//   }
// }

// module.exports = mongoose.model('Match', matchSchema);

var moment = require('moment');
var replies = require('../../behaviours/replies.js');
function Match() {

};

Match.practiceMatch = function() {
  return {
    title: "🇪🇸 La Liga",
    home: 'Barcelona',
    id: '#002',
    away: 'Atletico Madrid',
    date: new Date(2016, 09, 21, 23, 00),
    odds: { h: 1.69, a: 3.92, x: 5.09 }
  }
}

Match.isAMatchAvailable = function() {
  match = Match.practiceMatch();
  return match != null && new Date() < match.date;
}

Match.isValidGameId = function(gameId) {
  console.log(gameId,Match.practiceMatch().id);
  return gameId == Match.practiceMatch().id;
}

Match.validateWager = function(text) {
  bits = text.split(" ");
  if (bits.length == 3) {
    return { betId: bits[0], outcome: bits[1], amount: bits[2] }
  }
  else
    return null;
}

Match.getOutcome = function(wager) {
  match = Match.practiceMatch();
  odds = match.odds[wager.outcome.toLowerCase()];
  winnings = odds * wager.amount;
  template = replies.texts.wagerAccepted;

  message = template.replace(/{{amount}}/i, wager.amount);
  message = message.replace(/{{winnings}}/i, winnings);
  message = message.replace(/{{outcome}}/i, _getOutcomeEvent(wager.outcome.toLowerCase(), match));

  return message;
}

Match.getOddsString = function(match) {
  description = "*" + match.home + " (H) vs " + match.away + " (A):*";
  description += "\r\n" + match.title + " at " + moment(match.date).format("HH:mm");
  description += "\r\n_(H)-" + match.odds.h + " (A)-" + match.odds.a + " (Draw)-" + match.odds.x + "_";
  description += "\r\n*BET ID: " + match.id + "*";
  return description;
}

function _getOutcomeEvent(outcome,match) {
  switch (outcome) {
    case "h":
      return match.home + " win";
      break;
    case "a":
      return match.away + " win";
      break;
    case "x":
      return "draw";
      break;
  }
}

module.exports = Match;
