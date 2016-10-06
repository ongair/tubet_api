var moment = require('moment');
var replies = require('../../behaviours/replies.js');
var Game = require('./game.js');
var Bet = require('./bet.js');
var Player = require('./player.js');
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

Match.settle = function(game, status, score) {
  Bet.find({ gameId: game.gameId }, function(err, bets) {
    console.log("Settling bets:", bets);
    bets.forEach(function(bet) {

      Player.findOne({ contactId: bet.playerId }, function(err, punter) {
        if (bet.isWinningBet(score)) {
          amount = game.getPossibleWinnings(bet.betType, bet.amount);

          text = game.title() + "\r\n";
          text += "FT. " + game.score() + "\r\n";
          text += replies.texts.betWon;
          text = text.replace(/{{amount}}/i, amount);
          credits = punter.credits;
          credits += amount;

          punter.credits = credits;
          punter.save();

          text = text.replace(/{{credits}}/i, credits);

          notify.send(punter, text)
            .then(function() {
              punter.progress();
            });

        } else {
          text = game.title() + "\r\n";
          text += "FT. " + game.score() + "\r\n";
          text += replies.texts.betLost;
          notify.send(punter, text)
            .then(function() {
              player.progress();
            });
        }
        bet.state = "settled";
        bet.save();
      })
    })
  });

  if (status) {
    game.status = status;
    game.save();
  }
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
    title += moment(match.date).format("ll HH:mm");
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

module.exports = Match;
