var Game = require('../data/models/game.js');
var Bet = require('../data/models/bet.js');
var notify = require('../util/notification.js');
var Player = require('../data/models/player.js');
var replies = require('../behaviours/replies.js');

var matches = {
  settleMatch: function(req, res) {

    var id = req.params.id;
    var score = req.body.score;

    Game.findOne({ gameId: id }, function(err, game) {
      if (!game)
      {
        res.status(422);
        res.json({ message: "No game with id ", id });
      }
      else {

        Bet.find({ gameId: id }, function(err, bets) {
          bets.forEach(function(bet) {

            Player.findOne({ contactId: bet.playerId }, function(err, punter) {
              outcome = bet.getOutcomeFromScore(score);
              if (bet.isWinningBet(score)) {
                amount = bet.winnings(outcome, game.homeOdds, game.awayOdds, game.drawOdds)
                text = replies.texts.betWon;
                text = text.replace(/{{amount}}/i, amount);
                credits = punter.credits;
                credits += amount;

                punter.credits = credits;
                punter.save();

                text = text.replace(/{{credits}}/i, credits);

                notify.send(punter, text);

              } else {
                notify.send(punter, replies.texts.betLost);
              }
              bet.state = "settled";
              bet.save();
            })
          })
        });

        res.status(200);
        res.json({ success: true });
      }
    });

  },

  update: function(req, res) {
    var id = req.params.id;
    var tracker = req.body.tracker;
    var message = req.body.message;
    var score = req.body.score;
    var status = req.body.status;
    var type = req.body.type;

    Game.findOne({ gameId: id }, function(err, game) {
      if (!game)
      {
        res.status(422);
        res.json({ message: "No game with id ", id });
      }
      else {

        if (status)
          game.status = status;

        if (req.body.tracker)
          game.tracker = tracker;

        if (message) {
          notify.broadcast(message);
        }

        console.log("Match update", id, type, status, message, score);

        game.save();
        console.log("Game saved");
        if (type && score && message) {
          game.notifyPunters(type, score, message);
        }

        res.status(200);
        res.json({ success: true, id: game.id });
      }
    });
  },

  liveMatches: function(req, res) {

    Game.find({ $or: [{ status: 'live' }, { status: 'pending'}] }, function(err, games) {
      res.status(200)
      res.json(games);
    });

  }
}

module.exports = matches;
