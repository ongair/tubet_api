var sources = {
  getAll: function(req, res) {
    var allSources = [{
      id: 1,
      key: 'sportpesa',
      name: 'Sportpesa',
      url: 'https://www.sportpesa.com'
    },{
      id: 2,
      key: 'elitebet',
      name: 'Elitebet',
      url: 'http://www.elitebetkenya.com'
    },{
      id: 3,
      key: 'betin',
      name: 'BetIn',
      name: 'https://betin.co.ke'
    },{
      id: 4,
      key: 'justbet',
      name: 'JustBet',
      url: 'http://justbet.co.ke'
    }];

    res.json(allSources);
  }
}
module.exports = sources;
