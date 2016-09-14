var jwt = require('jwt-simple');
var auth = {

  // private method
// function genToken(user) {
//   var expires = expiresIn(7); // 7 days
//   var token = jwt.encode({
//     exp: expires
//   }, require('../config/secret')());
//
//   return {
//     token: token,
//     expires: expires,
//     user: user
//   };
// }
  generateToken: function(userId, role) {
    return jwt.encode({
      userId: userId,
      role: role
    }, require('../config/secret')());
  }
};

module.exports = auth;
