var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var matchSchema = new Schema({
  key: String,
  homeTeamId: String,
  awayTeamId: String,
  date: String
});

module.exports = mongoose.model('Match', matchSchema);
