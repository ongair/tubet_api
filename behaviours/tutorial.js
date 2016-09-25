var exports = module.exports = {};

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
