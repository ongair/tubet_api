var notify = require('../util/notification.js');
var replies = require('./replies.js');
var moment = require('moment');
var Match = require('../data/models/match.js');
var actions = {

  resolve: function(player, aiResponse) {
    return new Promise(function(resolve, reject) {
      switch (aiResponse.action) {
        case 'smalltalk.person':
          _simpleResponse(player,aiResponse);
          resolve(true);
          break;
        case 'status':
          _status(player, aiResponse);
          resolve(true);
          break;
        case 'history':
          _history(player, aiResponse)
          resolve(true);
          break;
        case 'balance':
          _balance(player, aiResponse);
          resolve(true);
          break;
        case 'games':
          _games(player, aiResponse);
          resolve(true);
          break;
        default:
          _simpleResponse(player, aiResponse);
          resolve(false);
      }
    });

  }
}

function _games(player, aiResponse) {
  _simpleResponse(player,aiResponse)
    .then(function() {
      Match.availableMatches(player)
        .then(function(games) {
          if (games.length == 0) {
            notify.send(player, replies.texts.noGames);
          }
          else if (games.length > 0) {
            availableText = replies.texts.availableMatches.replace(/{{amount}}/i, games.length);
            if (player.credits > 0) {
              notify.send(player, availableText)
                .then(function() {
                  preview = Match.previewGames(games);
                  notify.send(player, preview)
                    .then(function() {
                      notify.send(player, replies.texts.willYouBet, replies.texts.optionsYesNo)
                        .then(function() {
                          player.state = 'prompt';
                          player.stateData = "";
                          player.save();
                        });
                    });
                })
            }
            else {
              notify.send(player, replies.texts.noCredits);
            }
          }
        })
    })
}

function _history(player, response) {
  notify.send(player, response.reply)
    .then(function() {
      player.settledBets()
        .then(function(bets) {
          num = bets.length;
          if (num == 0)
            notify.send(player, replies.texts.noBetHistory);
          else {
            notify.send(player, replies.texts.betCount.replace(/{{count}}/i, num))
              .then(function() {

                results = [];
                // go through each of the bets the user has made
                bets.forEach(function(bet, idx) {
                  Match.getGame(bet.gameId)
                    .then(function(game) {
                      // console.log("Game", bet.betType, game.result, bet.amount);

                      won = bet.isWinningBet(game.score());
                      outcome = bet.getOutcomeFromScore(game.score());

                      winnings = won ? game.getPossibleWinnings(outcome, bet.amount) : 0;
                      // winnings
                      result = {
                        title: game.title(),
                        date: game.date,
                        won: won,
                        winnings: winnings,
                        wager: bet.amount,
                        betType: bet.betType,
                        game: game,
                        score: game.score(),
                      }

                      results.push(result);

                      if (results.length == bets.length)
                        _sendResults(player, results);
                    })
                });
              });
          }
        })
    });
}

function _status(player, aiResponse) {
  notify.send(player, aiResponse.reply)
    .then(function(id) {
      // check the status of bets
      player.liveBets()
        .then(function(bets) {
          if (bets.length == 0)
            notify.send(player, replies.texts.noBets);
          else {
            text = replies.texts.betCount.replace(/{{count}}/i, bets.length);
            notify.send(player, text)
              .then(function() {
                bets.forEach(function(bet) {
                  Match.getGame(bet.gameId)
                    .then(function(game) {
                      notify.send(player, bet.status(game));
                    })
                })
              })
          }
        })
    })
}

function _sendResults(player, results) {

  results = results.sort(function(betA, betB) {
    return betA.date - betB.date
  });

  strings = results.map(function(result) {
    str = result.title;
    str += "\r\n" + moment(result.date).format("ll HH:mm");
    str += "\r\n You bet " + result.wager + "💰 on a " + result.game.getBetOutcome(result.betType);
    str += "\r\n" + _outcomeIcon(result.won) + " *Result: " + result.score + ", Winnings: " + result.winnings + "💰 *";
    return str;
  });

  chain = strings.join("\r\n\r\n");

  winCount = results.reduce(function (total,result) { return result.won ? total+1 : total },0);
  totalWaged = results.reduce(function(sum, result) { return sum + result.wager },0);
  totalWin = results.reduce(function(sum, result) { return sum + result.winnings }, 0);

  notify.send(player, chain)
    .then(function() {
      // send the win ratio
      report = replies.texts.betHistory.replace(/{{wins}}/i, winCount);
      report = report.replace(/{{totalBets}}/i, results.length);
      report = report.replace(/{{totalWinnings}}/i, totalWin);
      report = report.replace(/{{totalWagered}}/i, totalWaged);
      report = report.replace(/{{credits}}/i, player.credits);

      notify.send(player, report);
    });
}

function _outcomeIcon(win) {
  return win ? "✅" : "❌";
}

function _balance(player, aiResponse) {
  balance = replies.texts.creditQuery.replace(/{{amount}}/i, player.credits);
  notify.send(player, balance);
}

function _simpleResponse(player, aiResponse) {
  return new Promise(function(resolve, reject) {
    notify.send(player, aiResponse.reply)
      .then(function(id) {
        resolve(id);
      })
  });
}

module.exports = actions;
