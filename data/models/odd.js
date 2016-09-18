var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var oddSchema = new Schema({
  homeOdds: Number,
  awayOdds: Number,
  gameId: String,
  drawOdds: String,
  sourceId: String
});

module.exports = mongoose.model('Odd', oddSchema);
