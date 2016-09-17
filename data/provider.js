var mongoose = require('mongoose');
// var models = require('./models.js');
var League = require('./models/leagues.js');
var Team = require('./models/teams.js');
var Message = require('./models/message.js');
var provider = {

  init: function() {
    mongoose.connect(process.env.MONGODB_URI);
    console.log('Initialized database connection');
  },

  setupData: function(req, res) {
    findOrCreateLeague('1', { key: '1', code: 'epl', name: 'English Premier League' })
      .then(function(league) {
        loadTeams(league)
          .then(function(){
            res.json({ success: true });
          });
      })
  },

  findOrCreateMessage: function(id, contactId, direction, messageType, text, source) {
    return new Promise(function(resolve, reject) {
      Message.findOne({ externalId: id }, function(err, message) {
        if (!message) {
          message = new Message({ contactId: contactId, externalId: id, messageType: messageType, direction: direction, text: text, source: source });
        }
        resolve(message);
      });
    });
  }
}

var findOrCreateLeague = function(key, data) {
  return new Promise(function(resolve, reject) {
    League.findOne({ key: key }, function(err, obj) {
      if (!obj) {
        obj = new League(data);
        obj.save(function(err, obj) {
          console.log("Saved league: ", obj)
        });
      }
      resolve(obj);
    })
  });
}

var loadTeams = function(league) {
  return new Promise(function(resolve, reject) {
    var teams = require('../data/en.clubs.json');
    teams.clubs.forEach(function(item) {
      Team.findOneByKey(item.key)
        .then(function(team) {
          if(!team) {
            team = new Team({ key: item.key, code: item.code, name: item.name, league: league.key });
            team.save(function(err, team){
              console.log("Saved ", team);
            });
          }
        })
    });
    resolve(true);
  });

}



module.exports = provider;
