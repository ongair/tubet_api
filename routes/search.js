var Team = require('../data/models/teams.js');
var search = {

  disambiguateTeams: function(req, res) {
    term = req.query.term;
    // console.log("Term: ", term);
    Team.resolveByName(term)
      .then(function(matches){
        res.json(matches.map(function (t) { return { id: t.id, key: t.key, name: t.name, code: t.code } }));
      });
  }
}

module.exports = search;
