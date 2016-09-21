var moment = require('moment');
var replies = require('../../behaviours/replies.js');
var Game = require('./game.js');
var Bet = require('./bet.js');
var notify = require('../../util/notification.js');

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

Match.update = function(player, game, type, score, agent, team, time) {
  return new Promise(function(resolve, reject) {
    var text, options;
    var predict = false;
    switch (type) {
      case "goal":
        text = "⚽ - " + agent + " (" + time + "'). " + score;
        break;
      case "halftime":
        text = "🕘 - Half time. Scores: " + score + ". What will you be having?";
        options = "🍺,☕️"
        break;
      case "secondhalf":
        text = "🕙 - Second half underway. Its 1-0  so far to FC Barcelona.";
        break;
      case "prediction":
        predict = true;
        break;
      default:
    }

    if (text) {
      notify.send(player, text, options)
        .then(function(id) {
          resolve(id);
        });
    }
    if (predict)
      Match.predictResult(player, game, score)
        .then(function(text) {
          console.log("Prediction:", player.contactName, text);
          // notify.send(player, text)
          //   .then(function(id) {
          //     resolve(true);
          //   })
        });


  });
}

Match.predictResult = function(player, game, score) {
  return new Promise(function(resolve, reject) {
    Bet.findOne({ playerId: player.contactId }, function(err, bet) {
      correct = _getRealtimeOutcome(score, bet.betType);
      amount = bet.amount;
      var text;

      if (correct) {
        text = "👍 ! Congratulations! You've won " + _getWinnings(game, bet.betType.toLowerCase(), amount) + "💰";
      }
      else {
        text = "👎 Sorry, better luck next time.";
      }

      resolve(text);
    });
  });
}

Match.announce = function(matchCode, player) {
  return new Promise(function(resolve, reject) {
    Game.findOne({ matchCode: matchCode }, function(err, game) {
      console.log("Game", game, err);
      if (game) {
        Bet.findOne({ playerId: player.contactId }, function(err, bet) {
          console.log("Found bet", bet, err);
          if (bet) {
            notify.send(player, "Your match Barcelona vs Atlético de Madrid has started. I'll send you goal updates. All the best!")
              .then(function(id) {
                resolve(id);
              });
          }
        });
      }
    })
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
