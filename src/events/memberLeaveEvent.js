
var guildService = require('../services/guildService');
var drunkTankService = require('../services/drunktankService');
var persistenceService = require('../services/persistenceService');

const HELPERS = require('../helpers/helpers');
const MESSAGES = require('../helpers/messages');
const LOGGER = require('../helpers/logger');

var CONFIG;
function injectConfig(_cfg) {
    CONFIG = _cfg;
}


/*
Handle member joining
We want to remove them from the checktank list
*/
async function handle(oldMember) {
    var user = persistenceService.getUser(oldMember.id);

    if (user == undefined) {
        return;
    }

    return persistenceService.saveUserLeaving(oldMember.id);
}

exports.handle = handle;
exports.injectConfig = injectConfig;
