var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var matchSchema = new Schema({
  key: String,
  homeTeamId: String,
  awayTeamId: String,
  date: String
});

matchSchema.statics.practiceMatch = function() {
  return {
    title: 'League Cup - 3rd Round',
    home: 'Leicester',
    away: 'Chelsea',
    date: new Date(2016, 09, 20, 21, 45);
    odds: { h: 4.03, a: 1.88, x: }
  }
}

module.exports = mongoose.model('Match', matchSchema);
