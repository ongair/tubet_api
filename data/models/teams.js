var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var _ = require('underscore');
var fuzzy = require('fuzzy');

var teamSchema = new Schema({
  key: String,
  code: String,
  name: String,
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

teamSchema.statics.resolveByName = function(name) {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.find(function(err, teams){
      matches = flatten(teams, name);
      self.find({ key: { $in: matches } }, function(err, results) {
        resolve(results);
      });
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

function flatten(teams, term) {
  applicableFields = teams.map(function(t) { return [t.code, t.key, t.name]});
  applicableFields = _.flatten(applicableFields);
  // console.log("Fields available are:", applicableFields);

  var results = fuzzy.filter(term, applicableFields);
  // remove all the uppercase stuff
  results = results.filter(function(item) {
    return item.original[0] !== item.original[0].toUpperCase()
  });

  results = results.map(function(item) {
    return item.original
  });
  // console.log("Results ", results);
  return results;
}

module.exports = mongoose.model('Team', teamSchema);
