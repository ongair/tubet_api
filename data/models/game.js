var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var gameSchema = new Schema({
  playerId: String
});

module.exports = mongoose.model('Game', matchSchema);
