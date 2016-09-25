var auth = require('./auth.js');
var Player = require('../data/models/player.js');
var League = require('../data/models/leagues.js');
var Team = require('../data/models/teams.js');
var Game = require('../data/models/game.js');
var Match = require('../data/models/match.js');
var ongair = require('ongair');
var leftPad = require('left-pad');
var moment = require('moment');
var notify = require('../util/notification.js');
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

  addPlayer: function(req, res) {

    var contactId = req.body.playerId;
    var name = req.body.name;
    var source = req.body.source;
    var state = req.body.state;
    var credits = req.body.credits;

    Player.findOneById(contactId)
      .then(function (player) {
        if (!player) {
          if (source == 'Telegram')
            name = name.replace(/ *\([^)]*\) */g, "");

          player = new Player({ contactId: contactId, contactName: name, source: source, state: state,
            credits: credits, termsAccepted: true, beta: true  });
          console.log(player);
          player.save();

          res.status(200);
          res.json({
            id: player.id
          });
        }
        else {
          res.status(422);
          res.json ({
            reason: player.id + " already exists"
          });
        }
      })
      .catch(function(ex) {
        console.log(ex);
      });
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

  announce: function(req, res) {
    code = req.body.code;

    Player.find({ state: 'live' }, function(err, players) {
      if (players) {
        players.forEach(function(player) {
          console.log("Going to annouce to ", player);
          Match.announce(code,player);
        });

        res.json({ success: true });
      }
    });
  },

  matchUpdate: function(req, res) {
    var code = req.body.code;
    var type = req.body.type;
    var score = req.body.score;
    var agent = req.body.agent;
    var team = req.body.team;
    var time = req.body.time;

    Game.findOne({ matchCode: code }, function(err, game) {
      if (game) {
        Player.find({ state: 'live' }, function(err, players) {
          if (players) {
            players.forEach(function(player) {
              Match.update(player, game, type, score, agent, team, time);
            });
          }
        });

        res.json({ success: true });
      }
    })
  },

  updatePlayer: function(req, res) {
    var id = req.params.id;
    Player.findOne({ contactId: id }, function(err, player) {
      if (player) {
        beta = req.body.beta;
        state = req.body.state;
        credits = req.body.credits;

        if (beta)
          player.beta = beta;

        if (state)
          player.state = state;

        if (credits)
          player.credits = credits;
        
        player.save();

        res.json({ success: true })
      }
    })
  },

  addTeam: function(req, res) {
    var externalId = req.body.externalId;
    var key = req.body.key;
    var name = req.body.name;
    var code = req.body.code;
    var league = req.body.league;

    Team.findOne({ key: key, league: league }, function(err, team) {
      if (team) {
        res.status(422);
        res.json({ message: "Team with id " + id + " already exists"});
      }
      else {
        var team = new Team({ key: key, name: name, code: code, league: league, externalId: externalId });
        team.save();
        res.status(200);
        res.json({ success: true, id: team.id });
      }
    })
  },

  addGame: function(req, res) {
    var gameId = req.body.gameId;
    var homeTeamKey = req.body.homeTeam;
    var awayTeamKey = req.body.awayTeam;
    var homeOdds = req.body.homeOdds;
    var awayOdds = req.body.awayOdds;
    var drawOdds = req.body.drawOdds;
    var date = req.body.date;
    var tracker = req.body.tracker;
    var status = req.body.status;
    var betable = req.body.betable;

    Game.findOne({ gameId: gameId }, function(err, game) {
      if (game) {
        res.status(422);
        res.json({ message: "Game with id " + gameId + " already exists"});
      }
      else {
        Game.count({}, function(err, count) {
          var matchCode = leftPad(count, 3, 0);

          game = new Game({ matchCode: matchCode, gameId: gameId, homeTeam: homeTeamKey, tracker: tracker, status: status,
            awayTeam: awayTeamKey, date: moment(date), homeOdds: homeOdds, awayOdds: awayOdds, drawOdds: drawOdds, betable: betable });

          game.save();

          res.json({ success: true, id: game.id });
        });
      }
    });

  },

  messagePlayer: function(req, res) {
    var id = req.params.id;

    var message = req.body.message;
    var state = req.body.state;
    var options = req.body.options;

    Player.findOne({ contactId: id }, function(err, player) {

      if (state) {
        player.state = state;
        player.save();
      }

      notify.send(player, message, options)
        .then(function(id) {
          res.json({ success: true, id: id });
        })
    });
  },

  addLeague: function(req, res) {

    // var id = req.body.id;
    var key = req.body.key;
    var name = req.body.name;
    var code = req.body.code;
    var externalId = req.body.externalId;

    League.findOne({ key : key }, function(err, league) {
      if (league) {
        res.status(422);
        res.json({ message: "League with key " + key + " already exists"});
      }
      else {
        league = new League();
        league.key = key;
        league.code = code;
        league.name = name;
        league.externalId = externalId;
        league.save();

        res.json({ success: true, id:  league.id });
      }
    })
  }
};

module.exports = admin;
