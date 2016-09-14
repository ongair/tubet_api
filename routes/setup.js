// var fs = require('fs');
var setup = {

  loadTeams: function(req, res) {
    var teams = require('../data/en.clubs.json');
    console.log("Teams: ", teams.clubs);
  }
};

module.exports = setup;
