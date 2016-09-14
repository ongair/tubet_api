var provider = require('../data/provider');
var League = require('../data/models/leagues.js');

var leagues = {
  getAll: function(req, res) {
    League.find(function(err, leagues) {
      allLeagues = leagues.map(function(league) {
        return {
          id: league.id,
          key: league.key,
          code: league.code,
          name: league.name
        }
      });
      res.json(allLeagues);
    });
  },

  getTeams: function(req, res) {
    var key = req.params.id;
    if (key) {
      League.findOne({ key: key }, function(err, league) {
        if(league) {
          console.log("League ", league);
          league.teams()
            .then(function(teams) {
              res.json(teams.map(function(team) {
                return {
                  id: team.id,
                  key: team.key,
                  code: team.code,
                  name: team.name
                }
              }))
            })
        } else {
          res.status(422);
          res.json({
            "status": 422,
            "message": "No such league"
          });
        }
      });
    }
    else {
      res.status(422);
      res.json({
        "status": 422,
        "message": "Invalid league key"
      });
    }
  },

  getFixtures: function(req, res) {
    var leagueID = req.params.id;
    if (leagueID == '1') {
      var fixtures = require('../data/en.fixtures.json');
      res.json({ rounds: fixtures.rounds });
    }
    else {
      res.status(422);
      res.json({
        "status": 422,
        "message": "Invalid league id"
      });
    }
  }

}
module.exports = leagues;
