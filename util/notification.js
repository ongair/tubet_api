var Slack = require('slack-node');
var ongair = require('ongair');
var Player = require('../data/models/player.js');
var request = require('request');

var notifications = {

  slack: function(message) {
    slack = new Slack();
    slack.setWebhook(process.env.SLACK_URL);
    slack.webhook({
      channel: "#tubet",
      username: "tubet",
      icon_emoji: ":soccer:",
      text: message
    }, function(err, response) {
      if(err)
        console.log(err);
    });
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
      client.sendMessage(contact.to(), _personalize(message, contact.contactName), options)
        .then(function(id) {
          resolve(id);
        })
        .catch(function (ex) {
          reject(ex);
        });
    });
  }
}

function _token(contact) {
  token = (contact.source == 'Telegram') ? process.env.ONGAIR_TOKEN : process.env.ONGAIR_TOKEN_MESSENGER;
  return token
}


function _personalize(text, name) {
  return text.replace(/{{name}}/i, name);
}

module.exports = notifications;
