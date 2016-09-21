var machina = require('machina');
var ongair = require('ongair');
var replies = require('./replies.js');
var ai = require('./ai.js');
var notify = require('../util/notification.js');
var Team = require('../data/models/teams.js');
var Match = require('../data/models/match.js');

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

        sendTermsAndConditions(player)
          .then(function() {
            player.state = 'terms';
            player.termsAccepted = false;
            player.save();
          });

      }
    },
    'terms' : {
      _onEnter: function() {
        checkTermsAndConditions(player, message.text)
          .then(function(accepted) {

            if (accepted)
              player.state = 'personalize';

            player.termsAccepted = accepted;
            player.save();
          });
      }
    },
    'personalize' : {
      _onEnter: function() {
        checkPersonalization(player, message.text)
      }
    },
    'tutorial': {
      _onEnter: function() {
        checkSkipTutorial(player, message.text)
          .then(function() {
            quiz(player)
              .then(function() {
                player.state = 'quiz';
                player.save();
              })
          })
      }
    },
    'quiz': {
      _onEnter: function() {
        checkTutorialAnswer(player, message.text)
          .then(function() {
            player.state = 'credits';
            player.save();
          });
      }
    },
    'credits': {
      _onEnter: function() {
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
        _sendAnalysis(message.text);
        waiting(player, message.text);
      }
    },
    'practice': {
      _onEnter: function() {
        _sendAnalysis(message.text);

        if (Match.isAMatchAvailable()) {
          acceptWager(player, message.text)
            .then(function(wager) {
              if (wager.accepted) {
                player.state = "live";
                balance = player.credits -  wager.amount;
                player.credits = balance;
                player.save();
                creditUpdate(player, balance);
              }
            });
        }

      }
    },
    'live' : {
      _onEnter: function() {
        _sendAnalysis(message.text);
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

function acceptWager(player, text) {
  return new Promise(function(resolve, reject) {
    wager = Match.validateWager(text);
    if (wager && Match.isValidGameId(wager.betId)) {
      availableCredit = player.credits;
      if (wager.amount <= availableCredit) {
        outcome = Match.getOutcome(wager);

        send(player.to(), outcome)
          .then(function(){
            notify.slack("A bet of " + wager.amount + "💰 has been placed by " + player.contactName);
            resolve({ accepted: true, amount: wager.amount });
          });
      }
      else {
        msg = replies.texts.betTooHigh.replace(/{{amount}}/i, player.credits);
        send(player.to(), msg)
          .then(function() {
            resolve({ accepted: false, amount: 0 });
          });
      }
    }
    else {
      send(player.to(), replies.texts.wrongBetId)
        .then(function() {
          resolve({ accepted: false, amount: 0 });
        })
    }
  });
}

function waiting(player, text) {
  return new Promise(function(resolve, reject) {
    availableMatch = Match.isAMatchAvailable();
    console.log("Matches available", availableMatch);
    if (availableMatch) {
      checkPractice(player, text)
        .then(function(practice){
          if (practice) {
            player.state = 'practice';
            player.credits += 100;
            player.save();
            creditUpdate(player, player.credits);
          }
          resolve(true);
        })
    }
    else
      send(player.to(), replies.texts.waiting)
        .then(function() {
          sendImage(player.to(), replies.gifs.mou, 'image/gif')
            .then(function() {
              resolve(true);
            })
        });
  })
}

function creditUpdate(player, credits) {
  send(player.to(), "You have " + credits + "💰 remaining.");
}

function checkPractice(player, text) {
  return new Promise(function(resolve, reject) {
    ai.agrees(text)
      .then(function(yes) {
        if(yes) {
          send(player.to(), replies.texts.practiceBegin)
            .then(function() {
              send(player.to(), replies.texts.practiceRule)
                .then(function() {
                  send(player.to(), replies.texts.practiceExample)
                    .then(function() {
                      send(player.to(), replies.texts.practiceInstruction)
                        .then(function() {
                          match = Match.practiceMatch();
                          oddString = Match.getOddsString(match);
                          send(player.to(), oddString)
                            .then(function() {
                              resolve(true);
                            })
                        })
                    })
                })
            })
        }
        else {
          send(player.to(),replies.texts.practiceNo)
            .then(function() {
              send(player.to(), replies.texts.practivePrompt, 'Yes,No')
                .then(function() {
                  resolve(false);
                });
            })
        }
      })
  });
}

function tutorial(player, team) {
  return new Promise(function(resolve, reject) {
    send(player.to(), replies.texts.teamSelected)
      .then(function() {
        image = replies.gifs[team.code.toLowerCase()];
        sendImage(to, image, 'image/gif')
          .then(function() {
            send(player.to(), replies.texts.bettingIntro)
              .then(function() {
                send(player.to(), replies.texts.explainerBet, replies.texts.explainerQuestionOdds + "," + replies.texts.explainerTest)
                  .then(function() {
                    resolve(true);
                  });
              })
          })
      })
  });
}

function quiz(player) {
  return new Promise(function(resolve, reject) {
    send(player.to(), replies.texts.explainerOddsExample)
      .then(function() {
        send(player.to(), replies.texts.explainerOddsQuiz, replies.texts.explainerOddsQuizOptions)
          .then(function() {
            resolve(true);
          })
      })
  });
}

function sendTermsAndConditions(player) {
  return new Promise(function(resolve, reject) {
    to = player.to()
    send(to, personalize(replies.texts.hi, player.contactName))
      .then(function() {
        send(to, replies.texts.disclaimer)
          .then(function() {
            send(to, replies.texts.prompt, 'Yes,No')
              .then(function() {
                resolve(true);
              })
          })
      })
  });
}

function checkPersonalization(player, answer) {
  to = player.to();
  return new Promise(function(resolve, reject) {
    ai.getTeam(answer)
      .then(function(team) {
        if (team) {
          console.log("Team", team);
          tutorial(player, team)
            .then(function() {
              player.state = 'tutorial';
              player.teamId = team.id;
              player.save();
            })
        } else {
          send(to, replies.texts.teamNotFound + answer + "?")
            .then(function() {
              // time to pick some of the teams
              Team.teamNames()
                .then(function(names) {
                  send(to, replies.texts.teamTryAgain, names.join(','));
                });
            })
        }
      })
  });
}

function checkTermsAndConditions(player, answer) {
  to = player.to()
  return new Promise(function(resolve, reject) {
    ai.agrees(answer)
      .then(function(yes) {
        if (yes) {
          send(to, replies.texts.termsAccepted)
            .then(function() {
              send(to, replies.texts.personalization)
                .then(function() {
                  resolve(true);
                })
            })
        }
        else {
          send(to, replies.texts.termsRejected, 'Yes,No')
            .then(function() {
              resolve(false);
            })
        }
      })
  });
}

function checkSkipTutorial(player, answer) {
  return new Promise(function(resolve, reject) {
    resp = answer.toLowerCase() == replies.texts.explainerTest.toLowerCase();
    if (resp) {
      // skip the tutorial bit go straight to the question
      resolve(true);
    }
    else {
      send(player.to(), replies.texts.explainerOdds)
        .then(function() {
          resolve(true);
        })
    }
  });
}

function checkTutorialAnswer(player, answer) {
  return new Promise(function(resolve, reject) {
    resp = answer.toLowerCase() == "Liverpool Win".toLowerCase() ? replies.texts.exampleCorrect : replies.texts.exampleWrong;
    send(player.to(), resp)
      .then(function() {
        send(player.to(), replies.texts.exampleExplainer)
          .then(function() {
            send(player.to(), replies.texts.creditsExplainer, '325,225,410')
              .then(function() {
                resolve(true);
              })
          })
      })
  })
}

function checkCreditsAnswer(player, answer) {
  to = player.to();
  return new Promise(function(resolve, reject) {
    resp = answer == '225' ? replies.texts.exampleResultsCorrect : replies.texts.exampleResultsWrong;

    send(to, resp)
      .then(function() {
        send(to, replies.texts.exampleResultsExplainer)
          .then(function() {
            send(to, replies.texts.startingCredits)
              .then(function() {
                availableMatch = Match.isAMatchAvailable();

                if (availableMatch)
                  send(to, replies.texts.practice, "Yes,No")
                    .then(function() {
                      resolve(true);
                    })
                else {
                  send(to, replies.text.waiting)
                    .then(function() {
                      resolve(true);
                    })
                }
              })
          })
      })
  });
}

function sendImage(to, url, type) {
  return new Promise(function(resolve, reject) {
    var client = new ongair.Client(process.env.ONGAIR_TOKEN);
    url = null;
    if (url)
      client.sendImage(to, url, type)
        .then(function(id) {
          setTimeout(function() {
            resolve(id);
          },3000);
        })
        .catch(function(ex) {
          reject(ex);
        })
    else {
      resolve(false);
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

function personalize(text, name) {
  return text.replace(/{{name}}/i, name);
}

function _sendAnalysis(message) {
  ai.process(message);
}

module.exports = Rules;
