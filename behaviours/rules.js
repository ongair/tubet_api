var machina = require('machina');
var ongair = require('ongair');
var replies = require('./replies.js');
var ai = require('./ai.js');
var notify = require('../util/notification.js');
var Team = require('../data/models/teams.js');
var Match = require('../data/models/match.js');
var Bet = require('../data/models/bet.js');

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
          .then(function(bet) {
            player.state = 'credits';
            player.tutorialAnswer = bet;
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
        console.log('In practice');
        _sendAnalysis(message.text);

        Match.isAMatchAvailable()
          .then(function(available) {
            console.log("Match available", available);
            if(available) {
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
          });
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
    if (wager) {
      console.log("Wager: ", wager);
      Match.isValidGameId(wager.betId)
        .then(function(valid) {
          if(!valid) {
            send(player.to(), replies.texts.wrongBetId)
              .then(function() {
                resolve({ accepted: false, amount: 0 });
              });
          } else {
            availableCredit = player.credits;
            if (wager.amount <= availableCredit) {
              Match.getOutcome(wager)
                .then(function(outcome) {
                  // place bet
                  var bet = new Bet({ playerId: player.to(), gameId: wager.id, amount: wager.amount, state: 'new', betType: wager.outcome, text: text })
                  bet.save();

                  send(player.to(), outcome)
                    .then(function(){
                      notify.slack("A bet of " + wager.amount + "💰 has been placed by " + player.contactName);
                      resolve({ accepted: true, amount: wager.amount });
                    });
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
        })
    }
    else {
      send(player.to(), replies.texts.wrongBetId)
        .then(function() {
          resolve({ accepted: false, amount: 0 });
        });
    }
  });
}

function waiting(player, text) {
  return new Promise(function(resolve, reject) {
    Match.isAMatchAvailable()
      .then(function(availableMatch) {
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
        else {
          send(player.to(), replies.texts.waiting)
            .then(function() {
              sendImage(player.to(), replies.gifs.mou, 'image/gif')
                .then(function() {
                  resolve(true);
                })
            });
        }
      })
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
                          Match.practiceMatch()
                            .then(function(match) {
                              oddString = Match.getOddsString(match);
                              send(player.to(), oddString)
                                .then(function() {
                                  resolve(true);
                                })
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
    image = replies.gifs[team.code.toLowerCase()];
    console.log(image);
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
      // })
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
    bet = _getTutorialBet(answer);
    prompt = replies.texts.creditsExplainer + answer + "?";
    send(player.to(), prompt)
      .then(function() {
        resolve(bet);
      })
  })
}

function checkCreditsAnswer(player, answer) {
  to = player.to();
  return new Promise(function(resolve, reject) {

    outcome = _getTutorialBetOutcome(answer);
    creditsSelection = "You have bet " + answer + " on a " + outcome + ". Let me check the results...";
    send(to, creditsSelection)
      .then(function() {
        sendImage(to, replies.gifs.win, "image/gif")
          .then(function() {

            odds = _getTutorialBetOdds(player.bet);
            winning = Math.ceil(odds * parseInt(answer));
            send(to, "Congratulations, you were right. You have won " + winning + " TuBets!")
              .then(function() {
                text = replies.texts.exampleResultsExplainer + odds + " x " + answer;
                send(to, text)
                  .then(function() {
                    send(to, replies.texts.startingCredits)
                      .then(function() {
                        send(to, replies.texts.waiting)
                          .then(function() {
                            resolve(true);
                          })
                      })
                  })
              })
          });
      })
  });
}

function sendImage(to, url, type) {
  return new Promise(function(resolve, reject) {
    var client = new ongair.Client(process.env.ONGAIR_TOKEN);
    // url = null;
    if (url)
      client.sendImage(to, url, type)
        .then(function(id) {
          setTimeout(function() {
            resolve(id);
          },3500);
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

function _getTutorialBet(answer) {
  if (answer.toLowerCase().startsWith() == "liverpool")
    return 'h';
  else if (answer.toLowerCase().startsWith() == "everton")
    return 'a';
  else
    return 'x';
}

function _getTutorialBetOdds(bet) {
  switch (bet) {
    case 'h':
      return 2.25;
      break;
    case 'a':
      return 3.25;
      break;
    default:
      return 4.1;
  }
}

function _getTutorialBetOutcome(bet) {
  switch (bet) {
    case 'h':
      return "Liverpool Win";
      break;
    case 'a':
      return "Everton Win";
      break;
    default:
      return "Draw";
  }
}

module.exports = Rules;
