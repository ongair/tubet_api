var request = require('request');
var livescores = {

  getResults: function(matchId) {
    return new Promise(function(resolve, reject) {
      var url = "https://api.crowdscores.com/api/v1/matches/" + matchId;

      console.log("About to call", url);

      var options = {
        url: url,
        headers: {
          'Content-Type': 'application/json',
          'x-crowdscores-api-key': process.env.LIVESCORES_API_KEY
        }
      }

      request.get(options, function(error, response, body) {
        if (!error) {
          if(response.statusCode == 200) {
            resolve(JSON.parse(body));
          }
        }
        else {
          reject(error);
        }
      });
    });
  }
}

module.exports = livescores;
