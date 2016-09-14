var leagues = {
  getAll: function(req, res) {
    var allLeagues = [{
      id: 1,
      name: 'English Premier League'
    }];

    res.json(allLeagues);
  },

  getTeams: function(req, res) {
    var leagueID = req.params.id;
    if (leagueID == '1') {
      var teams = require('../data/en.clubs.json');
      res.json({ teams: teams.clubs });
    }
    else {
      res.status(422);
      res.json({
        "status": 422,
        "message": "Invalid league id"
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
