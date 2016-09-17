var Player = require('../data/models/player.js');
var matchers = require('../util/matchers.js');
var machina = require('machina');
var ongair = require('ongair');

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


    var client = new ongair.Client(process.env.ONGAIR_TOKEN);
    console.log("Client created");
    machine = new machina.Fsm({

      initialize: function(options) {
        // useful for resolving states
        // if (!player.isNew()) {
        // }
        console.log("In initializer for player ", player);
      },

      namespace: 'tubet.registration',

      initialState: 'start',

      states : {

        // The start of the process
        start: {
          // ok we need to say some salutations
          // console.log("Starting");
          _onEnter: function() {
            var welcome = "Hi there. My name is Tubet. Can I call you " + player.contactName + "?";
            console.log("Hello there");
            client.sendMessage(player.contactId, welcome)
              .then(function(id) {
                console.log("We said hi: ", id);
              })
              .catch(function(err) {
                console.log("Ooops", err);
              });
          }
        }
      }
    });
    console.log("Machine created");
  },

  START_KEYWORDS: ['/start'],
  STATE_NEW: 'new',
}

module.exports = play;
