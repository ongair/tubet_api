var leagues = {
  getAll: function(req, res) {
    var allLeagues = [{
      id: 1,
      name: 'English Premier League'
    }];

    res.json(allLeagues);
  }
}
module.exports = leagues;
