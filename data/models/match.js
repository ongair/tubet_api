var moment = require('moment');
var replies = require('../../behaviours/replies.js');
var Game = require('./game.js');

function Match() {

};

Match.availableMatches = function(count) {
  return new Promise(function(resolve, reject) {
    Game.find({ date: {  $gte : moment() }}, function(err, games) {
      resolve(games);
    });
  });
}

Match.practiceMatch = function() {
  // return {
  //   title: "🇪🇸 La Liga",
  //   home: 'Barcelona',
  //   id: '#002',
  //   away: 'Atletico Madrid',
  //   date: new Date(2016, 09, 21, 23, 00),
  //   odds: { h: 1.69, a: 3.92, x: 5.09 }
  // }
  return new Promise(function(resolve, reject) {
    Match.availableMatches(1)
      .then(function(matches) {
        if (matches && matches.length > 0) {
          match = matches[0];
          resolve({
            title: "🇪🇸 La Liga",
            home: 'Barcelona',
            away: "Atlético de Madrid",
            id: match.matchCode,
            date: match.date,
            odds: { h: match.homeOdds, a: match.awayOdds, x: match.drawOdds }
          });
        }
      })
  });
}

Match.isAMatchAvailable = function() {
  return new Promise(function(resolve, reject) {
    Match.availableMatches()
      .then(function(games) {
        resolve(games.length);
      });
  })
}

Match.isValidGameId = function(gameId) {
  return new Promise(function(resolve, reject) {
    Match.practiceMatch()
      .then(function(match) {
        resolve(gameId == "#" + match.id);
      });
  });

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
  return new Promise(function(resolve, reject) {
    Match.practiceMatch()
      .then(function(match) {
        odds = match.odds[wager.outcome.toLowerCase()];
        winnings = odds * wager.amount;
        template = replies.texts.wagerAccepted;

        message = template.replace(/{{amount}}/i, wager.amount);
        message = message.replace(/{{winnings}}/i, winnings);
        message = message.replace(/{{outcome}}/i, _getOutcomeEvent(wager.outcome.toLowerCase(), match));

        resolve(message);
      });
  });
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
