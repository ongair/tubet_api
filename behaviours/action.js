var notify = require('../util/notification.js');
var replies = require('./replies.js');
var actions = {

  resolve: function(player, aiResponse) {
    return new Promise(function(resolve, reject) {
      switch (aiResponse.action) {
        case 'smalltalk.person':
          _simpleResponse(player,aiResponse);
          resolve(true);
          break;
        case 'balance':
          _balance(player, aiResponse);
          resolve(true);
          break;
        default:
          _simpleResponse(player, aiResponse);
          resolve(false);
      }
    });

  }
}

function _balance(player, aiResponse) {
  balance = replies.texts.creditUpdate.replace(/{{amount}}/i, player.credits);
  notify.send(player, balance);
}

function _simpleResponse(player, aiResponse) {
  notify.send(player, aiResponse.reply);
}

module.exports = actions;
