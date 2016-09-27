var express = require('express');
var router = express.Router();

var auth = require('./auth.js');
var sources = require('./sources.js');
var admin = require('./admin.js');
var leagues = require('./leagues.js');
var setup = require('./setup.js');
var odds = require('./odds.js');
var search = require('./search.js');
var provider = require('../data/provider.js');
var matches = require('./matches.js');
var bot = require('./bot.js');

/*
 * Routes that can be accessed only by autheticated users
 */
router.get('/api/v1/sources', sources.getAll);
router.get('/api/v1/leagues', leagues.getAll);
router.get('/api/v1/league/:id/teams', leagues.getTeams);
router.get('/api/v1/league/:id/fixtures', leagues.getFixtures);
router.get('/api/v1/search/teams', search.disambiguateTeams);

router.post('/api/v1/admin/league/:id/odds/', odds.addOdds);
router.post('/api/v1/admin/user/', admin.createUser);
router.post('/api/v1/admin/setup/base', provider.setupData);
router.get('/api/v1/admin/users', admin.getPlayers)
router.put('/api/v1/admin/users/:id', admin.updatePlayer);
router.post('/api/v1/admin/users', admin.addPlayer);
router.post('/api/v1/admin/users/:id/message', admin.messagePlayer);
router.post('/api/v1/admin/games/', admin.addGame);
router.post('/api/v1/admin/leagues/', admin.addLeague);
router.post('/api/v1/admin/teams/', admin.addTeam);
router.post('/ap1/v1/admin/broadcast', admin.broadcast);
router.post('/ap1/v1/admin/announce', admin.announce);
router.post('/api/v1/admin/matches/:id/settle', matches.settleMatch);
router.put('/api/v1/admin/matches/:id', matches.update);
router.get('/api/v1/admin/matches/live', matches.liveMatches);

// TubetBot
router.post('/api/bot/v1/respond', bot.respond);

module.exports = router;
