var Player = require('../data/models/player.js');
var matchers = require('../util/matchers.js');

var play = {

  findOrCreatePlayer: function(playerId, playerName) {
    return new Promise(function(resolve, reject) {
      Player.findOneById(playerId)
        .then(function (player) {
          if (!player) {
            player = new Player({ contactId: playerId, contactName: playerName, state: 'new' })
            player.save();
          }
          resolve(player);
        });
    });
  },

  advance: function(player, text) {
    console.log("About to advance with ", player, text);
    if (player.isNew()) {
      
    }
  },

  START_KEYWORDS: ['/start'],
  STATE_NEW: 'new'
}

module.exports = play;
