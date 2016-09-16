var behaviour = require('../behaviours/play.js');
var Player = require('../data/models/player.js');
var bot = {

  respond: function(req, res) {
    var evt = req.param('notification_type');
    var text = req.param('text');
    var contactId = req.param('external_contact_id');
    var contactName = req.param('name');
    console.log("Event: ", evt);

    if (evt == 'MessageReceived') {
      progress(contactId, contactName, text)
    }
    res.json({ success: true });
  },

  START_KEYWORD: 'start'
}

function progress(contactId, contactName, text) {
  behaviour.findOrCreatePlayer(contactId, contactName)
    .then(function(player) {
      behaviour.advance(player, text);
    });
}

module.exports = bot;
