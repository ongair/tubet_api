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
var smalltalk = require('./smalltalk.js');
var action = require('./action.js');

var player, message;
var Rules = machina.Fsm.extend({
  initialState: 'empty',
  states: {
    'empty' : {
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
              player.state = 'tutorial';

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
              player.state = 'live';
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
    'prompt': {
      _onEnter: function() {
        _sendAnalysis(message.text);

        bettingPrompt(player, message.text)
          .then(function(yes) {
            if (yes) {
              if (yes  > 1) {
                player.state = 'betting';
              }
              else if (yes == 1) {
                // console.log("Jumping to punt", player.stateData);
                player.state = 'punt';
              }
            }
            else
              player.state = 'live';
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
            else {
              player.state = 'live';
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
            if (accepted) {
              player.state = 'prompt';
            }
            else {
              player.state = 'live';
            }

            console.log("Remaining credits", player.credits);
            player.save();
          });
      }
    },
    'live' : {
      _onEnter: function() {

        console.log("Small talk", message.id)
        smalltalk.respond(message.text, message.id)
          .then(function(response) {
            action.resolve(player, response);
          });

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

function confirmBet(player, text, data) {
  return new Promise(function(resolve, reject) {
    ai.agrees(text)
      .then(function(yes) {
        if (yes) {
          id = data['id'];
          amount = data['amount'];
          option = data['option'];

          // place the bet
          var bet = new Bet({ playerId: player.to(), gameId: id, amount: amount, state: 'live', betType: option, createdAt: new Date() });
          bet.save();

          var remaining = player.credits - amount;
          player.credits = remaining;

          console.log("Remaining credits ", player.credits);

          send(player, replies.texts.betAccepted)
            .then(function() {
              send(player, creditsRemaining(player))
                .then(function() {
                  Match.availableMatches(player)
                    .then(function(matches) {
                      if (matches.length > 0) {
                        // if player has more credits
                        if (player.credits > 0) {
                          send(player, availableMatches(matches.length) + "\r\n\r\n" + replies.texts.willYouBet, replies.texts.optionsYesNo)
                            .then(function() {
                              resolve(true);
                            })
                        }
                        else {
                          send(player, replies.texts.noCredits)
                            .then(function() {
                              resolve(false);
                            });
                        }
                      }
                      else {
                        send(player, replies.texts.complete)
                          .then(function() {
                            send(player, replies.texts.updateChannel)
                              .then(function() {
                                  resolve(false);
                              })
                          });
                      }
                    })
                })
            })
        }
        else {
          send(player, replies.texts.declinedBet)
            .then(function() {
              resolve(false);
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
        var everything = amount == player.credits;
        var confirm = "";

        if (everything)
          confirm = replies.texts.theLot + "\r\n";

        confirm += replies.texts.betConfirmation;

        gameId = data['id'];
        option = data['option'];

        Match.getGame(gameId)
          .then(function(game) {
            winnings = game.getPossibleWinnings(option, amount);
            outcome = game.getBetOutcome(option);

            confirm = confirm.replace(/{{amount}}/i, amount);
            confirm = confirm.replace(/{{winnings}}/i, winnings);
            confirm = confirm.replace(/{{outcome}}/i, outcome);


            send(player, confirm, replies.texts.optionsYesNo)
              .then(function() {
                resolve(amount);
              })
          })
      }
      else {
        text = replies.texts.betTooHigh.replace(/{{amount}}/i, player.credits);
        send(player, text)
          .then(function() {
            resolve(null);
          });
      }
    }
    else {
      send(player, replies.texts.badBetAmount)
        .then(function() {
          resolve(null);
        })
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
            send(player, creditsRemaining(player))
              .then(function(){
                send(player, replies.texts.amountPrompt + " " + game.getBetOutcome(option) +  "?")
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
          send(player, replies.texts.gameSelected)
            .then(function() {
              send(player, game.asBet(player), game.betOptions(player))
                .then(function() {
                  resolve(game.gameId);
                });
            });
        } else {
          send(player, replies.texts.didNotUnderstandGameBet)
            .then(function() {
              resolve(null);
            })
        }
      });
  });
}

function bettingPrompt(player, text) {
  return new Promise(function(resolve, reject) {
    ai.agrees(text)
      .then(function(yes) {
        if (!yes) {
          send(player, replies.texts.betOptionDeclined, "Bet")
            .then(function() {
              resolve(yes);
            })
        }
        else {
          send(player, replies.texts.bettingAccepted)
            .then(function() {
              // Need to find the games
              Match.availableMatches(player)
                .then(function (matches) {

                  if (matches.length  > 1) {
                    // need to check if matches exist
                    options = matches.map(function(match) {
                      return match.asOption();
                    });
                    games = options.join(",")

                    send(player, replies.texts.pickGame, games)
                      .then(function() {
                        resolve(matches.length);
                      })
                  }
                  else if (matches.length == 0) {
                    send(player, replies.texts.noGames)
                      .then(function() {
                        resolve(false);
                      })
                  }
                  else if (matches.length == 1) {
                    // should show only the one match
                    game = matches[0];

                    send(player, game.asBet(player), game.betOptions(player))
                      .then(function() {
                        id = game.gameId;
                        data = JSON.stringify({ id: id });
                        player.stateData = data;

                        resolve(matches.length);
                      });
                  }
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
          send(player, availableText)
            .then(function() {
              send(player, previewMatches(matches))
                .then(function() {
                  send(player, replies.texts.willYouBet, replies.texts.optionsYesNo)
                    .then(function() {
                      resolve(true);
                    })
                })
            })
        }
        else {
          send(player, replies.texts.waiting)
            .then(function() {
              notify.sendImage(player, replies.gifs.mou, 'image/gif')
                .then(function() {
                  resolve(false);
                })
            });
        }
      });
  })
}

function creditUpdate(player, credits) {
  send(player, "You have " + credits + "💰 remaining.");
}

function tute(player) {
  return new Promise(function(resolve, reject) {
    send(player, replies.texts.bettingIntro)
      .then(function() {
        send(player, replies.texts.explainerBet, replies.texts.explainerQuestionOdds + "," + replies.texts.explainerTest)
          .then(function() {
            resolve(true);
          });
      });
  });
}

function quiz(player) {
  return new Promise(function(resolve, reject) {
    send(player, replies.texts.explainerOddsExample)
      .then(function() {
        send(player, replies.texts.explainerOddsQuiz, replies.texts.explainerOddsQuizOptions)
          .then(function() {
            resolve(true);
          })
      })
  });
}

function sendTermsAndConditions(player) {
  return new Promise(function(resolve, reject) {
    send(player, personalize(replies.texts.hi, player.contactName))
      .then(function() {
        send(player, replies.texts.disclaimer)
          .then(function() {
            send(player, replies.texts.prompt, 'Yes,No')
              .then(function() {
                resolve(true);
              })
          })
      })
  });
}

function checkPersonalization(player, answer) {
  return new Promise(function(resolve, reject) {
    ai.getTeam(answer)
      .then(function(team) {
        if (team) {
          tute(player, team)
            .then(function() {
              player.state = 'tutorial';
              player.teamId = team.id;
              player.save();
            })
        } else {
          send(player, replies.texts.teamNotFound + answer + "?")
            .then(function() {
              // time to pick some of the teams
              Team.teamNames()
                .then(function(names) {
                  send(player, replies.texts.teamTryAgain, names.join(','));
                });
            })
        }
      })
  });
}

function checkTermsAndConditions(player, answer) {
  return new Promise(function(resolve, reject) {
    ai.agrees(answer)
      .then(function(yes) {
        if (yes) {
          send(player, replies.texts.termsAccepted)
            .then(function() {
              tute(player)
                .then(function(result) {
                  resolve(result);
                });
            })
        }
        else {
          send(player, replies.texts.termsRejected, 'Yes,No')
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
      send(player, replies.texts.explainerOdds)
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
    send(player, prompt)
      .then(function() {
        resolve(bet);
      })
  })
}

function checkCreditsAnswer(player, answer) {
  return new Promise(function(resolve, reject) {

    outcome = tutorial.getTutorialBetOutcome(player.tutorialAnswer);
    if (_isNumericBet(answer))
    {
      creditsSelection = "You have bet " + answer + "💰 on a " + outcome + ". Let me check the results...";
      send(player, creditsSelection)
        .then(function() {
          notify.sendImage(player, tutorial.getCelebrationGif(player.tutorialAnswer), "image/gif")
            .then(function() {

              odds = tutorial.getTutorialBetOdds(player.tutorialAnswer);
              winning = Math.ceil(odds * parseInt(answer));
              send(player, "Congratulations, you were right. You have won " + winning + " 💰 TuBets!")
                .then(function() {
                  text = replies.texts.exampleResultsExplainer + odds + " x " + answer;
                  send(player, text)
                    .then(function() {
                      send(player, replies.texts.startingCredits)
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
                                send(player, replies.texts.waiting)
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

function send(to, message, options) {
  return new Promise(function(resolve, reject) {
    notify.send(to, message,options)
      .then(function(id) {
        resolve(id);
      })
      .catch(function(ex) {
        reject(ex);
      })
  })
}

function previewMatches(matches) {
  strings = matches.map(function(match) {
    homeTeam = replies.teams[match.homeTeam]['full'];
    awayTeam = replies.teams[match.awayTeam]['full'];

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
  if (answer.toLowerCase().startsWith("liverpool"))
    return 'h';
  else if (answer.toLowerCase().startsWith("everton"))
    return 'a';
  else
    return 'x';
}

function _isNumericBet(answer) {
  return Number.isInteger(parseInt(answer));
}



module.exports = Rules;
