var Slack = require('slack-node');

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
      console.log(response);
    });
  }
}
