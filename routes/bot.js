var bot = {

  respond: function(req, res) {
    var evt = req.param('notification_type');
    var text = req.param('text');
    var contactId = req.param('external_contact_id');
    var contactName = req.param('name');
    console.log("Event: ", evt);

    if (evt == 'MessageReceived') {

    }
    res.json({ success: true });
  },

  START_KEYWORD: 'start'
}

function progress(contactId, contactName, text) {
  
}

module.exports = bot;
