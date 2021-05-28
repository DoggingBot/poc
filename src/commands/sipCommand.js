
const HELPERS = require('../helpers/helpers');
var persistenceService = require('../services/persistenceService');
var CONFIG;
function injectConfig(_cfg) {
    CONFIG = _cfg;
}

async function handle(message) {
    var action = message.content.toLowerCase();
    var userId = message.author.id;

    var userObj = persistenceService.addSip(action, userId);

    var msgString = HELPERS.getAtString(userObj.userID) + 
        " has enjoyed " + userObj.count + " total " + userObj.sipStr + "'s";

    message.channel.send(msgString);
}

exports.handle = handle;
exports.injectConfig = injectConfig;