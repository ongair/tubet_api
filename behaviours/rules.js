var machina = require('machina');
var ongair = require('ongair');
var replies = require('./replies.js');

var player, message;
var Rules = machina.Fsm.extend({
  initialState: 'unknown',
  states: {
    'unknown': {
      _onEnter: function() {
        console.log('In unknown state');
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
              })
          })
      }
    }
  },
  load: function(p, m) {
    try
    {
      state = p.state;
      player = p;
      message = m;

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
