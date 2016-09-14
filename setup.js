var auth = require('./routes/auth.js');
var jwt = require('jwt-simple');

token = auth.generateToken('kimenye@gmail.com', 'admin');

console.log("Token: ", token);

// var token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJraW1lbnllQGdtYWlsLmNvbSJ9.--CpRfOVOgauQCgGDt0BwPN3sCfG7VAQBTOi93tXUio";
var decoded = jwt.decode(token, require('./config/secret.js')());

console.log("Decoded: ", decoded);
