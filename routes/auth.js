var jwt = require('jwt-simple');
var auth = {

  authorize: function(req, res, next, user) {
    if(user && user.role == 'admin')
      next();
    else {
      res.status(403);
      res.json({
        "status": 403,
        "message": "Not Authorized"
      });
      return;
    }
  },

  authenticate: function(req, res, callback, next) {

    try {
      user = getUser(req);
      if (user) {
        if (!callback)
          next();
        else
          callback(req, res, next, user);
      }
      else if (user === false) {
        res.status(401);
        res.json({
          "status": 401,
          "message": "Invalid Token or Key"
        });
        return;
      }
      else {
        res.status(403);
        res.json({
          "status": 403,
          "message": "Not Authorized"
        });
        return;
      }
    }
    catch(err) {
      res.status(500);
      res.json({
        "status": 500,
        "message": "Oops something went wrong",
        "error": err
      });
    }
  },

  generateToken: function(userId, role) {
    return jwt.encode({
      userId: userId,
      role: role
    }, require('../config/secret')());
  }
};

function getUser(req) {
  var token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'];
  var key = (req.body && req.body.x_key) || (req.query && req.query.x_key) || req.headers['x-key'];

  if (token && key) {
    try {
      var decoded = jwt.decode(token, require('../config/secret.js')());
      return decoded;
    }
    catch(err) {
      throw err;
    }
  }
  else {
    return false;
  }
}

module.exports = auth;
