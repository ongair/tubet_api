var League = require('../data/models/leagues.js');
var odds = {
  addOdds: function(req, res) {
    key = req.params.id;

    source = req.body.source;
    homeTeam = req.body.homeTeam;
    awayTeam = req.body.awayTeam;
    homeOdds = req.body.homeOdds;
    awayOdds = req.body.awayOdds;
    drawOdds = req.body.drawOdds;
    date = req.body.date;
    gameId = req.body.gameId;
    // role = req.body.role;

    if (key) {
      League.findOne({ key: key }, function(err, league) {
        if (league) {
          // add the odds
          addOdd(source, league, homeTeam, awayTeam, homeOdds, awayOdds, drawOdds, date, gameId)
            .then(function(success) {
                res.json({ success: success });
            });
        }
      });
    }

  }
};

function addOdd(source, league, homeTeam, awayTeam, homeOdds, awayOdds, drawOdds, date, gameId) {
  return new Promise(function(resolve, reject) {
    console.log('Addin odds ', league.name, source, homeTeam, awayTeam, homeOdds, awayOdds, drawOdds, date, gameId);

    // homeTeam = Team

    resolve(true);
  });
}

module.exports = odds;
