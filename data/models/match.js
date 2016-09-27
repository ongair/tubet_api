var moment = require('moment');
var replies = require('../../behaviours/replies.js');
var Game = require('./game.js');
var Bet = require('./bet.js');
var notify = require('../../util/notification.js');

function Match() {

};

Match.getGame = function(id) {
  return new Promise(function(resolve, reject) {
    Game.findOne({ gameId: id }, function(err, game) {
      resolve(game);
    })
  });
}

Match.previewGames = function(matches) {
  strings = matches.map(function(match) {
    homeTeam = replies.teams[match.homeTeam]['full'];
    awayTeam = replies.teams[match.awayTeam]['full'];

    title = "";
    if (match.featured)
      title = "*" + homeTeam + " v " + awayTeam + "🔥*";
    else
      title = "*" + homeTeam + " v " + awayTeam + "*";
    title += "\r\n";
    title += moment(match.date).format('H:mm');
    return title;
  });
  return strings.join("\r\n\r\n");
}

Match.availableMatches = function(player) {
  return new Promise(function(resolve, reject) {
    Game.find({ $or: [{ status: 'pending'}], betable: true }, function(err, games) {
      // exclude the players matches
      player.liveBets()
        .then(function(bets) {
          if(bets.length == 0)
            resolve(games);
          else {
            betGameIds = bets.map(function(bet) { return bet.gameId });
            console.log(betGameIds);
            // check to see if any of the games are included in this list

            games = games.filter(function(game) {
              return betGameIds.indexOf(game.gameId) < 0;
            });

            resolve(games);
          }
        });
    });
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

Match.validateWager = function(text) {
  bits = text.split(" ");
  if (bits.length == 3) {
    return { betId: bits[0], outcome: bits[1], amount: bits[2] }
  }
  else
    return null;
}

Match.predictResult = function(player, game, score) {
  return new Promise(function(resolve, reject) {
    Bet.findOne({ playerId: player.contactId }, function(err, bet) {
      correct = _getRealtimeOutcome(score, bet.betType);
      amount = bet.amount;
      var text;

      if (correct) {
        text = "👍 ! Congratulations! You've won " + _getWinnings(game, bet.betType.toLowerCase(), Math.ceil(amount)) + "💰";
      }
      else {
        text = "👎 Sorry, better luck next time.";
      }
      resolve(text);
    });
  });
}

Match.getOutcome = function(wager) {
  return new Promise(function(resolve, reject) {
    Match.practiceMatch()
      .then(function(match) {
        odds = match.odds[wager.outcome.toLowerCase()];
        winnings = Math.ceil(odds * wager.amount);
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

function _getWinnings(game,outcome,amount) {
  var odds;
  if (outcome == "h")
    odds = game.homeOdds;
  else if (outcome == "a")
    odds = game.awayOdds;
  else
    odds = game.drawOdds;

  return odds*amount;
}

function _getRealtimeOutcome(score,bet) {
  scores = score.split("-");
  homeScore = scores[0];
  awayScore = scores[1];
  var correctOutcome;
  if (homeScore > awayScore)
    correctOutcome = "h";
  else if (awayScore > homeScore)
    correctOutcome = "a";
  else
    correctOutcome = "x";

  return Math.ceil(bet.toLowerCase() == correctOutcome);
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
