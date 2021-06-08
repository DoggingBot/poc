
var guildService = require('../services/guildService');
var drunkTankService = require('../services/drunktankService');
var persistenceService = require('../services/persistenceService');
var syncTankService = require('../services/syncTankService');

const HELPERS = require('../helpers/helpers');
const MESSAGES = require('../helpers/messages');
const LOGGER = require('../helpers/logger');

var CONFIG;
function injectConfig(_cfg) {
    CONFIG = _cfg;
}

/*
Handle member joining
we want to check if they have an outstanding tanking, and resume it
This event assumes the role persistence bot has acted and they have 2drunk2party
*/
async function handle(newMember) {
    var user = persistenceService.getUserHistorical(newMember.id);

    if (user == undefined) {
        return;
    }

    //Update our records 
    persistenceService.saveUserJoining(newMember.id);

    //Sync the tank after 10 seconds to give the role persistence bot some time to catch up
    return setTimeout(() => {
        return syncTankService.syncTank();
    }, 10000);
}

exports.handle = handle;
exports.injectConfig = injectConfig;