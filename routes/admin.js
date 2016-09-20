var auth = require('./auth.js');
var Player = require('../data/models/player.js');
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

  updatePlayer: function(req, res) {
    // id =
    var id = req.params.id;

    console.log("Player id", id);

    Player.findOne({ contactId: id }, function(err, player) {
      if (player) {
        console.log("Player", player);

        beta = req.body.beta;
        state = req.body.state;

        player.beta = beta;
        player.state = state;
        player.save();

        // homeTeam = req.body.homeTeam;

        res.json({ success: true })
      }
    })
  }
};

module.exports = admin;
