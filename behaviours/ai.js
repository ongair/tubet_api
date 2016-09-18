'use strict';
const Wit = require('node-wit').Wit;
var _ = require('underscore');

var ai = {

  process: function(text, context) {
    return new Promise(function(resolve, reject) {
      const client = new Wit({accessToken: process.env.NODE_ACCESS_TOKEN});
      client.message(text, {})
        .then(function(data) {
          resolve(data.entities);
        });
    });
  }  
}

module.exports = ai;
