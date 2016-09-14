var sources = {
  getAll: function(req, res) {
    var allSources = [{
      id: 1,
      name: 'Sportpesa',
      url: 'https://www.sportpesa.com'
    },{
      id: 2,
      name: 'Elitebet',
      url: 'http://www.elitebetkenya.com'
    },{
      id: 3,
      name: 'BetIn',
      name: 'https://betin.co.ke'
    },{
      id: 4,
      name: 'JustBet',
      url: 'http://justbet.co.ke'
    }];

    res.json(allSources);
  }
}
module.exports = sources;
