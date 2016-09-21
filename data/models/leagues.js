var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Team = require('./teams.js');

var leagueSchema = new Schema({
  key: String,
  code: String,
  name: String,
  externalId: String
});

leagueSchema.methods.teams = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    Team.find({ league: self.key }, function(err, teams) {
      resolve(teams);
    })
  });
}



module.exports = mongoose.model('League', leagueSchema);
