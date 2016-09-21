var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var _ = require('underscore');
var fuzzy = require('fuzzy');

var teamSchema = new Schema({
  key: String,
  code: String,
  name: String,
  externalId: String,
  league: String
});

teamSchema.statics.findOneByKey = function(key) {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.findOne({ key: key }, function(err, team) {
      resolve(team);
    });
  });
}

teamSchema.statics.teamNames = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.find(function(err, teams) {
      var names = _.map(teams, function(team) { return team.name });
      resolve(names);
    });
  })
}

teamSchema.statics.resolveByName = function(name) {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.find(function(err, teams){
      matches = _fuzzySearch(teams, name);
      resolve(matches);
    });
  });
}

teamSchema.statics.findByCodeOrCreate = function(code, data) {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.findOneByCode(code)
      .then(function(team) {
        if(!team) {
          obj = new Team();
          obj.save(function(err, obj) {
            resolve(obj);
          });
        }
      });
  })
}

function _fuzzySearch(teams, term) {
  applicableFields = teams.map(function(t) { return [t.key, t.name]});
  applicableFields = _.flatten(applicableFields);

  var results = fuzzy.filter(term, applicableFields);

  results = results.map(function(item) {
    idx = item.index;
    original = item.original;
    isKey = _isKey(idx);
    team = null;

    for(x=0;x<teams.length;x++) {
      t = teams[x];
      if (isKey) {
        if (t.key == original) {
          team = t;
          break;
        }
      } else {
        if (t.name == original) {
          team = t;
          break;
        }
      }
    }
    return team;
  });
  uniq = _.uniq(results, function(r) { return r.key });
  return uniq;
}

function _isKey(idx) {
  return idx % 2 == 0;
}

module.exports = mongoose.model('Team', teamSchema);
