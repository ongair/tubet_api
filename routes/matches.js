var Game = require('../data/models/game.js');
var Bet = require('../data/models/bet.js');
var notify = require('../util/notification.js');
var Player = require('../data/models/player.js');
var Match = require('../data/models/match.js');
var replies = require('../behaviours/replies.js');

var matches = {
  settleMatch: function(req, res) {

    var id = req.params.id;
    var score = req.body.score;
    var status = req.body.status;

    Game.findOne({ gameId: id }, function(err, game) {
      if (!game)
      {
        res.status(422);
        res.json({ message: "No game with id ", id });
      }
      else {
        Match.settle(game, status, score);
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
    var progress = req.body.progress;
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

        if (tracker)
          game.tracker = tracker;

        if (progress)
          game.minute = progress;

        if (message && type != "COM") {
          notify.broadcast(message);
        }

        console.log("Match update", id, type, status, message, score);
        if (score)
          game.result = score;

        game.save();
        if (type && score && message) {
          game.notifyPunters(type, score, message, (game.featured && type == "COM"));
        }

        if (type && type == "FT") {
          Match.settle(game, status, score);
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
