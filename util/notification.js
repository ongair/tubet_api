var Slack = require('slack-node');
var ongair = require('ongair');
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

  send: function(contact,message,options) {
    return new Promise(function(resolve, reject) {
      var client = new ongair.Client(process.env.ONGAIR_TOKEN);
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


function _personalize(text, name) {
  return text.replace(/{{name}}/i, name);
}

module.exports = notifications;
