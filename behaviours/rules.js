var machina = require('machina');
var ongair = require('ongair');
var moment = require('moment');
var replies = require('./replies.js');
var ai = require('./ai.js');
var notify = require('../util/notification.js');
var Team = require('../data/models/teams.js');
var Match = require('../data/models/match.js');
var Bet = require('../data/models/bet.js');
var tutorial = require('./tutorial.js');

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
          .then(function(valid) {
            if (!valid) {
              player.state = 'waiting';
              player.credits = 100;
              player.save();
            }
            else {
              player.state = 'prompt';
              player.credits = 100;
              player.save();
            }
          })
      }
    },
    'waiting': {
      _onEnter: function() {
        _sendAnalysis(message.text);
        waiting(player, message.text)
          .then(function(hasMatches) {
            if (hasMatches) {
              player.state = 'prompt';
              player.save();
            }
          });
      }
    },
    'prompt' : {
      _onEnter: function() {
        _sendAnalysis(message.text);

        bettingPrompt(player, message.text)
          .then(function(yes) {
            if (yes)
              player.state = 'betting';
            else
              player.state = 'waiting';
            player.save();
          })
      }
    },
    'betting': {
      _onEnter: function() {
        _sendAnalysis(message.text);

        console.log("In betting status: ", message.text);
        selectBet(player, message.text)
          .then(function(selected) {
            if (selected) {
              data = JSON.stringify({ id: selected });

              player.state = 'punt';
              player.stateData = data;
              player.save();
            }
          });
      }
    },
    'punt': {
      _onEnter: function() {
        console.log("In punting mode", message.text);

        data = JSON.parse(player.stateData);
        id = data['id'];

        selectPuntOption(player, message.text, id)
          .then(function(option) {

            if (option) {
              data.option = option;

              data = JSON.stringify(data);
              player.state = 'wager';
              player.stateData = data;
              player.save();
            }

          });
      }
    },
    'wager': {
      _onEnter: function() {
        console.log("In wager step", message.text);

        data = JSON.parse(player.stateData);
        wager(player, message.text, data)
          .then(function(amount) {
            if (amount) {
              data.amount = amount;

              data = JSON.stringify(data);
              player.state = 'confirm';
              player.stateData = data;
              player.save();
            }
          });
      }
    },
    'confirm': {
      _onEnter: function() {
        console.log("Confirm", message.text);
        data = JSON.parse(player.stateData);
        confirmBet(player, message.text, data)
          .then(function(accepted) {
            player.stateData = "";
            player.state = 'prompt';

            console.log("Remaining credits", player.credits);
            player.save();
          });
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

function confirmBet(player, text, data) {
  return new Promise(function(resolve, reject) {
    ai.agrees(text)
      .then(function(yes) {
        if (yes) {
          id = data['id'];
          amount = data['amount'];
          option = data['option'];

          // place the bet
          var bet = new Bet({ playerId: player.to(), gameId: id, amount: amount, state: 'live', betType: option })
          bet.save();

          var remaining = player.credits - amount;
          player.credits = remaining;

          console.log("Remaining credits ", player.credits);

          send(player.to(), replies.texts.betAccepted)
            .then(function() {
              send(player.to(), creditsRemaining(player))
                .then(function() {
                  Match.availableMatches(player)
                    .then(function(matches) {
                      if (matches.length > 0) {
                        send(player.to(), availableMatches(matches.length) + "\r\n\r\n" + replies.texts.willYouBet, replies.texts.optionsYesNo)
                          .then(function() {
                            resolve(true);
                          })
                      }
                      else {
                        send(player.to(), replies.texts.complete)
                          .then(function() {
                            send(player.to(), replies.texts.updateChannel)
                              .then(function() {
                                  resolve(true);
                              })
                          });
                      }
                    })
                })
            })
        }
      })
  });
}

function wager(player, amount, data) {
  return new Promise(function(resolve, reject) {
    // first validate the bet
    if (_isNumericBet(amount)) {
      amount = parseInt(amount);
      if (amount <= player.credits) {
        confirm = replies.texts.betConfirmation;

        gameId = data['id'];
        option = data['option'];

        Match.getGame(gameId)
          .then(function(game) {
            winnings = game.getPossibleWinnings(option, amount);
            outcome = game.getBetOutcome(option);

            confirm = confirm.replace(/{{amount}}/i, amount);
            confirm = confirm.replace(/{{winnings}}/i, winnings);
            confirm = confirm.replace(/{{outcome}}/i, outcome);

            send(player.to(), confirm, replies.texts.optionsYesNo)
              .then(function() {
                resolve(amount);
              })
          })
      }
    }
    else {
      reject(null);
    }
  });
}

function selectPuntOption(player, text, id) {
  return new Promise(function(resolve, reject) {
    // get the game first

    Match.getGame(id)
      .then(function(game) {
        if (game) {
          option = game.getBetOption(text);

          if (option) {
            send(player.to(), creditsRemaining(player))
              .then(function(){
                send(player.to(), replies.texts.amountPrompt + " " + game.getBetOutcome(option) +  "?")
                  .then(function() {
                    resolve(option);
                  })
              })
          }
        }
      })

  });
}

function creditsRemaining(p) {
  credits = p.credits;
  return replies.texts.creditUpdate.replace(/{{amount}}/i, credits);
}

function availableMatches(count) {
  return replies.texts.availableOtherMatches.replace(/{{amount}}/i, count);
}

function selectBet(player, text) {
  return new Promise(function(resolve, reject) {
    Match.availableMatches(player)
      .then(function(matches) {
        // select a match
        game = matches.find(function(match) {
          return text == match.asOption();
        });

        if (game) {
          send(player.to(), replies.texts.gameSelected)
            .then(function() {
              send(player.to(), game.asBet(), game.betOptions())
                .then(function() {
                  resolve(game.gameId);
                });
            });
        } else {
          resolve(null);
        }
      });
  });
}

function bettingPrompt(player, text) {
  return new Promise(function(resolve, reject) {
    ai.agrees(text)
      .then(function(yes) {
        if (!yes) {
          send(player.to(), replies.texts.betOptionDeclined, "Bet")
            .then(function() {
              resolve(yes);
            })
        }
        else {
          send(player.to(), replies.texts.termsAccepted)
            .then(function() {
              // Need to find the games
              Match.availableMatches(player)
                .then(function (matches) {
                  // need to check if matches exist
                  options = matches.map(function(match) {
                    return match.asOption();
                  });
                  games = options.join(",")

                  send(player.to(), replies.texts.pickGame, games)
                    .then(function() {
                      resolve(yes);
                    })
                })
            })
        }
      })
  });
}

function waiting(player, text) {
  return new Promise(function(resolve, reject) {
    Match.availableMatches(player)
      .then(function(matches) {
        if(matches.length > 0) {
          availableText = replies.texts.availableMatches.replace(/{{amount}}/i, matches.length);
          send(player.to(), availableText)
            .then(function() {
              send(player.to(), previewMatches(matches))
                .then(function() {
                  send(player.to(), replies.texts.willYouBet, replies.texts.optionsYesNo)
                    .then(function() {
                      resolve(true);
                    })
                })
            })
        }
        else {
          send(player.to(), replies.texts.waiting)
            .then(function() {
              sendImage(player.to(), replies.gifs.mou, 'image/gif')
                .then(function() {
                  resolve(false);
                })
            });
        }
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

    outcome = tutorial.getTutorialBetOutcome(answer);
    if (_isNumericBet(answer))
    {
      creditsSelection = "You have bet " + answer + "💰 on a " + outcome + ". Let me check the results...";
      send(to, creditsSelection)
        .then(function() {
          sendImage(to, replies.gifs.win, "image/gif")
            .then(function() {

              odds = tutorial.getTutorialBetOdds(player.bet);
              winning = Math.ceil(odds * parseInt(answer));
              send(to, "Congratulations, you were right. You have won " + winning + " 💰 TuBets!")
                .then(function() {
                  text = replies.texts.exampleResultsExplainer + odds + " x " + answer;
                  send(to, text)
                    .then(function() {
                      send(to, replies.texts.startingCredits)
                        .then(function() {
                          Match.availableMatches(player)
                            .then(function(matches) {
                              if (matches.length > 0) {
                                waiting(player, "Yes")
                                  .then(function() {
                                    resolve(true);
                                  })
                              }
                              else {
                                send(to, replies.texts.waiting)
                                  .then(function() {
                                    resolve(false);
                                  })
                              }
                            });
                        })
                    })
                })
            });
        })
    } else {
      send(to, replies.texts.nonNumericBet)
        .then(function() {
          resolve(false);
        });
    }
  });
}

function sendImage(to, url, type) {
  return new Promise(function(resolve, reject) {
    var client = new ongair.Client(process.env.ONGAIR_TOKEN);
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

function previewMatches(matches) {
  strings = matches.map(function(match) {
    homeTeam = replies.teams[match.homeTeam];
    awayTeam = replies.teams[match.awayTeam];

    title = "*" + homeTeam + " v " + awayTeam + "*";
    title += "\r\n";
    title += moment(match.date).format('llll');
    return title;
  });
  return strings.join("\r\n\r\n");
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

function _isNumericBet(answer) {
  return Number.isInteger(parseInt(answer));
}



module.exports = Rules;
