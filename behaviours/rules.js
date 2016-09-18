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
              tutorial(player)
                .then(function() {
                  player.state = 'tutorial';
                  player.teamId = team.id;
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
    },
    'tutorial': {
      _onEnter: function() {
        console.log("Start of the tutorial", message.text);

        checkTutorialAnswer(player, message.text)
          .then(function() {
            player.state = 'credits';
            player.save();
          });
      }
    },
    'credits': {
      _onEnter: function() {
        console.log("Start of the credits check");

        checkCreditsAnswer(player, message.text)
          .then(function() {
            player.state = 'waiting';
            player.credits = 100;
            player.save();
          })
      }
    },
    'waiting': {
      _onEnter: function() {
        console.log('Ready for betting');

        send(player.to(), replies.waiting);
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

function tutorial(player) {
  return new Promise(function(resolve, reject) {
    send(player.to(), replies.teamSelected)
      .then(function() {
        send(player.to(), replies.bettingIntro)
          .then(function() {
            send(player.to(), replies.explainerBet)
              .then(function() {
                send(player.to(), replies.explainerOdds)
                  .then(function() {
                    send(player.to(), replies.explainerOddsExample, 'Liverpool Win,Everton Win,Draw')
                      .then(function() {
                        resolve(true);
                      })
                  })
              });
          })
      })
  });
}

function checkTutorialAnswer(player, answer) {
  return new Promise(function(resolve, reject) {
    resp = answer.toLowerCase() == "Liverpool Win".toLowerCase() ? replies.exampleCorrect : replies.exampleWrong;
    send(player.to(), resp)
      .then(function() {
        send(player.to(), replies.exampleExplainer)
          .then(function() {
            send(player.to(), replies.creditsExplainer, '325,225,325')
              .then(function() {
                resolve(true);
              })
          })
      })
  })
}

function checkCreditsAnswer(player, answer) {
  return new Promise(function(resolve, reject) {
    resp = answer == '225' ? replies.exampleResultsCorrect : replies.exampleResultsWrong;
    messages = [{ text: resp }, { text: replies.exampleResultsExplainer }, { text: replies.startingCredits }, { text: replies.goodLuck }]
    chain(player.to(), messages)
      .then(function() {
        resolve(true);
      });
  });
}

function chain(to, messages) {
  return new Promise(function(resolve, reject) {
    for(var idx=0;idx<messages.length;idx++) {
      mesage = message[idx];
      send(to, message.text, message.options)
        .then(function() {
          if(index == messages.length - 1)
            resolve(true);
        })
    }    
  });
}

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
