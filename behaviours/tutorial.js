var exports = module.exports = {};
var replies = require('./replies.js');

function getTutorialBetOdds(bet) {
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

function getCelebrationGif(bet) {
  switch (bet) {
    case 'h':
      return replies.gifs.liv;
      break;
    case 'a':
      return replies.gifs.eve;
      break;
    default:
      return replies.gifs.draw;
  }
}

function getTutorialBetOutcome(bet) {
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

exports.getTutorialBetOutcome = getTutorialBetOutcome;
exports.getTutorialBetOdds = getTutorialBetOdds;
exports.getCelebrationGif = getCelebrationGif;
