var Slack = require('slack-node');
var ongair = require('ongair');
var Player = require('../data/models/player.js');
var request = require('request');
var Twitter = require('twitter');

var notifications = {

  slack: function(message) {
    slack = new Slack();
    slack.setWebhook(process.env.SLACK_URL);
    if (_isProduction()) {
      slack.webhook({
        channel: "#tubet",
        username: "tubet",
        icon_emoji: ":soccer:",
        text: message
      }, function(err, response) {
        if(err)
          console.log(err);
      });
    }
  },

  tweet: function(message) {

    return new Promise(function(resolve, reject) {
      var client = new Twitter({
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
        access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
      });

      client.post('statuses/update', {status: message}, function(error, tweet, response) {
        if (!error) {
          resolve(true)
        }
      });
    });
  },

  broadcast: function(message) {
    if (_isProduction()) {
      var client = new ongair.Client(process.env.ONGAIR_TOKEN);
      client.sendMessage(process.env.BROADCAST_CHANNEL, message)
        .then(function(id) {
          console.log("Sent", message, id);
        })
    }
  },

  sendToMany: function(ids, message, image, image_type, beta, options) {
    ids.forEach(function(id) {
      Player.findOne({ contactId: id }, function(err, player) {
        var client = new ongair.Client(_token(player));
        // if (beta && !player.beta)
        //   return;

        if (image && image_type) {
          console.log('Sending image', image, image_type, player.to());
          client.sendImage(player.to(), image, image_type)
            .then(function(id) {
              setTimeout(function() {
                client.sendMessage(player.to(), _prepare(message, player), options);
              }, 2000);
            })
        }
        else {
          client.sendMessage(player.to(), _prepare(message, player), options);
        }
      });
    });
  },

  chainSend: function(contact, messages) {
    return new Promise(function(resolve, reject) {
      chain = messages.map(function(text) {
        return notifications.send(contact, text);
      });

      Promise.all(chain)
        .then(function(value) {
          resolve(value);
        })
    });
  },

  send: function(contact,message,options) {
    return new Promise(function(resolve, reject) {
      var client = new ongair.Client(_token(contact));
      message = _prepare(message, contact);
      client.sendMessage(contact.to(), message, options)
        .then(function(id) {
          resolve(id);
        })
        .catch(function (ex) {
          reject(ex);
        });
    });
  },

  sendImage: function(contact, url, type) {
    return new Promise(function(resolve, reject) {
      var client = new ongair.Client(_token(contact));
      if (url) {
        console.log("Send image",contact.to(), url, type);
        client.sendImage(contact.to(), url, type)
          .then(function(id) {
            setTimeout(function() {
              resolve(id);
            },3500);
          })
          .catch(function(ex) {
            reject(ex);
          })
      }
      else {
        resolve(false);
      }
    });
  }

}

function _token(contact) {
  token = (contact.source == 'Telegram') ? process.env.ONGAIR_TOKEN : process.env.ONGAIR_TOKEN_MESSENGER;
  return token
}

function _preformat(text,contact) {
  if (!contact.isTelegram()) {
    regex = /(\*|_)/g;
    return text.replace(regex, "");
  }
  else
    return text;
}

function _prepare(message, contact) {
  message = _personalize(message, contact.contactName);
  return _preformat(message, contact);
}

function _personalize(text, name) {
  return text.replace(/{{name}}/i, name);
}

function _isProduction() {
  return (process.env.ENV == 'production');
}


module.exports = notifications;
