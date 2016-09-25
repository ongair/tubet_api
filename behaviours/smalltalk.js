var apiai = require('apiai');

var smalltalk = {

  respond: function(text) {
    return new Promise(function(resolve, reject) {
      _query(text)
        .then(function(response) {
          resolve(response);
        })
        .catch(function (error) {
          reject(error);
        })
    });
  }

}

function _query(text) {

  return new Promise(function(resolve, reject) {

    var app = apiai(process.env.APIAI_TOKEN);
    var request = app.textRequest(text);

    request.on('response', function(response) {
      var response = _resolveResponse(response);
      resolve(response);
    });

    request.on('error', function(error) {
      reject(error);
    });

    request.end();
  });
}

function _resolveResponse(response) {
  var result = response.result;
  return {
    action: result.action,
    reply: result.fulfillment.speech
  }
}

module.exports = smalltalk;
