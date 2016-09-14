var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var matchSchema = new Schema({
  key: String,
  homeTeam: String,
  awayTeam: String,
  date: String
});

module.exports = mongoose.model('Match', matchSchema);
