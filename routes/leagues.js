var leagues = {
  getAll: function(req, res) {
    var allLeagues = [{
      id: 1,
      name: 'English Premier League'
    }];

    res.json(allLeagues);
  },

  getTeams: function(req, res) {
    var teams = require('../data/en.clubs.json');
    res.json({ teams: teams.clubs });
  },

  getFixtures: function(req, res) {
    var fixtures = require('../data/en.fixtures.json');
    res.json({ rounds: fixtures.rounds });
  }

}
module.exports = leagues;
