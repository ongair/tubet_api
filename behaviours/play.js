var Player = require('../data/models/player.js');
var Message = require('../data/models/message.js');
var provider = require('../data/provider.js');
var matchers = require('../util/matchers.js');
var notify = require('../util/notification.js');
var machina = require('machina');
var Rules = require('./rules.js');


var play = {

  getPlayer: function(playerId, playerName, source) {
    return new Promise(function(resolve, reject) {
      Player.findOneById(playerId)
        .then(function (player) {
          if (!player) {
            name = playerName
            if (source == 'Telegram')
              name = name.replace(/ *\([^)]*\) */g, "");

            player = new Player({ contactId: playerId, contactName: name, source: source, state: 'new' });
            player.save();
            notify.slack("A new player (" + name + ") from " + source + " has signed up");
          }
          resolve(player);
        });
    });
  },

  analyze: function(player, msg) {
    return new Promise(function(resolve, reject) {
      provider.findOrCreateMessage(msg.id, player.id, 'IN', 'Text', msg.text, player.source)
        .then(function(message) {
          resolve(message);
        });
    });
  },

  advance: function(player, message) {
    var rules = new Rules();
    rules.load(player, message);
  },

  START_KEYWORDS: ['/start'],
  STATE_NEW: 'new',
}
module.exports = play;
