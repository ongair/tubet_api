var Slack = require('slack-node');
var ongair = require('ongair');
var Player = require('../data/models/player.js');
var request = require('request');

var notifications = {

  slack: function(message) {
    slack = new Slack();
    slack.setWebhook(process.env.SLACK_URL);
    if (process.env.ENV == 'production') {
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

  broadcast: function(message) {
    var client = new ongair.Client(process.env.ONGAIR_TOKEN);
    client.sendMessage(process.env.BROADCAST_CHANNEL, message)
      .then(function(id) {
        console.log("Sent", message, id);
      })
  },

  sendToMany: function(ids, message) {
    var self = this;
    ids.forEach(function(id) {
      Player.findOne({ contactId: id }, function(err, player) {
        var client = new ongair.Client(process.env.ONGAIR_TOKEN);
        client.sendMessage(player.to(), _personalize(message, player.contactName));
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
      message = _personalize(message, contact.contactName);
      message = _preformat(message, contact);
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
              console.log("Id", id);
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


function _personalize(text, name) {
  return text.replace(/{{name}}/i, name);
}

module.exports = notifications;
