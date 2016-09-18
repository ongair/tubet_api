var machina = require('machina');
var ongair = require('ongair');
// var Rules = function(player, message) {
//   this.player = player,
//   this.message = message,
//   this.engine = machina.Fsm.extend({
//     // initialState: 'new',
//     initialize: function() {
//       // console.log("State", player.state);
//       console.log("This", this);
//       // state = player.state;
//       this.transition(player.state);
//     },
//     states: {
//       'new': {
//         _onEnter: function() {
//           console.log("We are in the " + player.state + " state");
//         }
//       }
//     }
//   }),
//
//   this.getState = function() {
//     return this.engine.state;
//   }
// }
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
        send(to, "Hi there. My name is Lyne. I'll be your bookie. Right now I'm only taking bets in the English Premier League but I'll add some more soon.")
          .then(function() {
            send(to, "Lets get to know each other " + player.contactName + ". I'll go first. I'm a Liverpool fan. Which team do you support?");
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
