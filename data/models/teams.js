var mongoose = require('mongoose');
var Schema = mongoose.Schema;

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

module.exports = mongoose.model('Team', teamSchema);
