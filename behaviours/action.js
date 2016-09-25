var notify = require('../util/notification.js');
var replies = require('./replies.js');
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
          if (games.length == 0)
            notify.send(player, replies.texts.noGames);
          else if (games.length > 0) {
            availableText = replies.texts.availableMatches.replace(/{{amount}}/i, games.length);
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
        })
    })
}

function _status(player, aiResponse) {
  notify.send(player, aiResponse.reply)
    .then(function(id) {
      // check the status of bets
      player.liveBets()
        .then(function(bets) {
          console.log("Bets", bets);
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
