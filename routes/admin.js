var auth = require('./auth.js');
var Player = require('../data/models/player.js');
var ongair = require('ongair');
var admin = {

  createUser: function(req, res) {
    email = req.body.email;
    role = req.body.role;

    if (email && role && (role == "admin" || role == "user")) {
      token = auth.generateToken(email, role);
      res.json({ token: token });
    }
    else {
      res.status(422);
      res.json({
        "status": 422,
        "message": "Email and role are required"
      });
    }
  },

  getPlayers: function(req, res) {
    Player.find(function(err, players) {
      all = players.map(function(player) {
        return {
          id: player.id,
          contactId: player.contactId,
          name: player.contactName,
          state: player.state,
          credits: player.credits,
          beta: player.beta
        }
      });
      res.json(all);
    });
  },

  broadcast: function(req, res) {
    state = req.body.state;
    beta = req.body.beta;
    message = req.body.message;
    options = req.body.options;
    args = { state: state };

    if (beta)
      args.beta = beta

    Player.find(args, function(err, players) {
      if (players) {
        var client = new ongair.Client(process.env.ONGAIR_TOKEN);
        players.forEach(function(player) {
          client.sendMessage(player.to(), message, options)
        })
        res.json({ success: true, sent: players.length });
      }
    })
  },

  updatePlayer: function(req, res) {
    var id = req.params.id;
    Player.findOne({ contactId: id }, function(err, player) {
      if (player) {
        beta = req.body.beta;
        state = req.body.state;

        player.beta = beta;
        player.state = state;
        player.save();

        res.json({ success: true })
      }
    })
  }
};

module.exports = admin;
