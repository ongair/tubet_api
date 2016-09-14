// var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var url = process.env.MONGODB_URI;

var setup = {

  install: function(req, res) {
    console.log('Running data installation process');

    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err);
      console.log("Connected successfully to server");

      leagueExists('1', db)
        .then(function(exists) {
          console.log('League exists ', exists);
          if (!exists)
          {
            addLeague('1', 'English Premier League', db)
              .then(function(league) {
                console.log("Added league", league);
                db.close();
              });
          }
          db.close();
        });
    });

  },

  loadTeams: function(req, res) {
    var teams = require('../data/en.clubs.json');
    console.log("Teams: ", teams.clubs);

    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err);
      console.log("Connected successfully to server");

      db.close();
    });
  }
};

function teamExists(key, db) {

}

function leagueExists(key, db) {
  return new Promise(function(resolve, reject) {
    findLeague(key, db)
      .then(function(results) {
        resolve(results.length > 0);
      });
  });
}

function findLeague(key, db) {
  return new Promise(function(resolve, reject) {
    console.log("Finding league: ", key);
    var collection = db.collection('leagues');
    collection.find({ 'key': key }).toArray(function(err, docs) {
      resolve(docs);
    });
  });
}

function addLeague(key, name, db) {
  return new Promise(function(resolve, reject){
    console.log('Adding league :', key, name);

    var collection = db.collection('leagues');
    collection.insertOne({ key: key, name: name}, function(err, res) {
      assert.equal(null, err);
      assert.equal(1, res.insertedCount);
      resolve(res.ops[0]);
    });
  })
}

module.exports = setup;
