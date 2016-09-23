var Game = require('../data/models/game.js');
var notify = require('../util/notification.js');

var matches = {
  matchUpdate: function(req, res) {

    var id = req.params.id;
    Game.findOne({ gameId: id }, function(err, game) {
      if (!game)
      {
        res.status(422);
        res.json({ message: "No game with id ", id });
      }
      else {
        res.status(200);
        res.json({ success: true });
      }
    });

  },

  update: function(req, res) {
    var id = req.params.id;
    var tracker = req.body.tracker;
    var message = req.body.message;

    Game.findOne({ gameId: id }, function(err, game) {
      if (!game)
      {
        res.status(422);
        res.json({ message: "No game with id ", id });
      }
      else {

        game.status = req.body.status;
        if (req.body.tracker)
          game.tracker = req.body.tracker;

        if (message) {
          // console.log("Should broadcast ", message);
          notify.broadcast(message);
        }

        game.save()

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
