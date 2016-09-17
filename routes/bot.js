var behaviour = require('../behaviours/play.js');
var Player = require('../data/models/player.js');
var bot = {

  respond: function(req, res) {
    var evt = req.param('notification_type');
    var text = req.param('text');
    var contactId = req.param('external_contact_id');
    var contactName = req.param('name');
    var messageId = req.param('id');
    var accountType = req.param('account_type');
    var source = req.param('account');

    console.log("All params ", evt, text, contactId, contactName, messageId, accountType, source);

    if (evt == 'MessageReceived') {
      progress(contactId, contactName, accountType, text, messageId);
    }
    res.json({ success: true });
  },

  START_KEYWORD: 'start'
}

function progress(contactId, contactName, accountType, text, messageId) {
  behaviour.getPlayer(contactId, contactName, accountType)
    .then(function(player) {
      behaviour.analyze(player, { id: messageId, text: text })
        .then(behaviour.advance);
        // .then(function(player, message) {
        //     behaviour.advance(player, message);
        // })

    });
}

module.exports = bot;
