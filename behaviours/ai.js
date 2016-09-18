'use strict';
const Wit = require('node-wit').Wit;
var _ = require('underscore');
var Team = requre('../data/models/teams.js');
var ai = {

  process: function(text, context) {
    return new Promise(function(resolve, reject) {
      queryWit(text)
        .then(function(entities) {
          resolve(entities);
        });
    });
  },

  getTeam: function(text, context) {
    return new Promise(function(resolve, reject) {
      Team.resolveByName(text)
        .then(function(results) {
          if (results.length == 0) {
            // check wit ai
            resolve(null)
          }
          else if (results.length == 1) {
            resolve(results[0])
          }
        });
    });
  }

  agrees: function(text) {
    return new Promise(function(resolve, reject) {
      queryWit(text)
        .then(function(entities) {
          var check = entities.yes_no;
          resolve(check && check[0].value == 'yes');
        });
    });
  }
}

module.exports = ai;

function queryWit(text) {
  return new Promise(function(resolve, reject) {
    const client = new Wit({accessToken: process.env.NODE_ACCESS_TOKEN});
    client.message(text, {})
      .then(function(data) {
        resolve(data.entities);
      });
  });
}
