var Player = require('../data/models/player.js');

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
  }
}

module.exports = play;
