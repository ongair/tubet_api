var machina = require('machina');
var ongair = require('ongair');
var replies = require('./replies.js');
var ai = require('./ai.js');

var player, message;
var Rules = machina.Fsm.extend({
  initialState: 'unknown',
  states: {
    'unknown': {
      _onEnter: function() {
      }
    },
    'new' : {
      _onEnter: function() {
        to = player.contactId;
        send(to, replies.hi)
          .then(function(id) {
            send(to, replies.diclaimer)
              .then(function(id) {
                send(to, replies.prompt, 'Yes,No')
                  .then(function() {
                    // save the fact that we have prompted for terms and Conditions
                    player.state = 'terms';
                    player.termsAccepted = false;
                    player.save();

                    console.log('Updated the player status', player);
                  })
              })
          })
      }
    },
    'terms' : {
      _onEnter: function() {
        console.log('In the terms and conditions step. Response is ', message);
        ai.agrees(message.text)
          .then(function(yes) {
            player.termsAccepted = yes;
            if (yes) {
              player.state = 'personalize';
              send(player.to(), replies.termsAccepted)
                .then(function(id) {
                  send(player.to(), replies.personalization)
                    .then(function() {
                      player.save();
                    });
                });
            }
            else {
              send(player.to(), replies.termsRejected);
            }
            player.save();
          });
      }
    },
    'personalize' : {
      _onEnter: function() {
        console.log('In personalization step', message);
        ai.getTeam(message.text)
          .then(function(team) {
            if (team) {
              send(player.to(), replies.teamSelected)
                .then(function() {
                  player.save();
                });
            }
            else {
              console.log('We were not able to find a team');
              send(player.to(), replies.teamNotFound + message.text)
                .then(function() {
                  send(player.to(), replies.teamTryAgain);
                })
            }
          });
      }
    }
  },
  load: function(p, m) {
    try
    {
      state = p.state;
      player = p;
      message = m;

      console.log("About to transition to ", state);

      this.transition(state);
    }
    catch(ex) {
      console.log("Error", ex);
    }
  }
});

function send(to, message, options) {
  return new Promise(function(resolve, reject) {
    var client = new ongair.Client(process.env.ONGAIR_TOKEN);
    client.sendMessage(to, message, options)
      .then(function(id) {
        resolve(id);
      })
      .catch(function (ex) {
        reject(ex);
      });
  });
}

module.exports = Rules;
