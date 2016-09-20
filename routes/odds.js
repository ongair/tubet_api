var League = require('../data/models/leagues.js');
var Team = require('../data/models/teams.js');
var ai = require('../behaviours/ai.js');

var odds = {
  addOdds: function(req, res) {
    code = req.params.id;

    source = req.body.source;
    homeTeam = req.body.homeTeam;
    awayTeam = req.body.awayTeam;
    homeOdds = req.body.homeOdds;
    awayOdds = req.body.awayOdds;
    drawOdds = req.body.drawOdds;
    date = req.body.date;
    gameId = req.body.gameId;
    // role = req.body.role;

    // console.log(code,source,homeTeam,awayTeam,homeOdds,drawOdds,date,gameId);

    if (code) {
      League.findOne({ code: code }, function(err, league) {
        // console.log(league);
        if (league) {
    //       // add the odds
          addOdd(source, league, homeTeam, awayTeam, homeOdds, awayOdds, drawOdds, date, gameId)
            .then(function(success) {
                res.json({ success: success });
            });
        }
        else
          res.json({ success: true });
      });
    }
    else
      res.json({ success: true });
  }
};

function addOdd(source, league, homeTeam, awayTeam, homeOdds, awayOdds, drawOdds, date, gameId) {
  return new Promise(function(resolve, reject) {
    var home, away, match, odd;
    ai.getTeam(homeTeam)
      .then(function(team) {
        home = team;
        ai.getTeam(awayTeam)
          .then(function(team) {
            away = team;

            matchId = getMatchId(home,away,date);

            console.log("Match is ", matchId);
          })
      })

    resolve(true);
  });
}

function getTeam(name) {
  return new Promise(function(resolve, reject) {
    Team.resolveByName(name)
      .then(function(teams) {
        resolve(teams[0]);
      })
  })
}

function getMatchId(homeTeam,awayTeam,date) {
  // console.log("Date", date);
  dt = new Date(Date.parse(date))
  dateString = dt.getDate() + dt.getMonth() + dt.getFullYear();
  return homeTeam.code + "_" + awayTeam.code + "_" + dateString;
}

module.exports = odds;
