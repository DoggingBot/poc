
const HELPERS = require('../helpers/helpers');
var persistenceService = require('../services/persistenceService');
var CONFIG;
function injectConfig(_cfg) {
    CONFIG = _cfg;
}

async function handle(message) {
    var action = message.content.toLowerCase();
    var userId = message.author.id;
    var nickname = message.author.username;

    var userObj = persistenceService.addSip(action, userId, nickname);

    var msgString = HELPERS.getAtString(userObj.userID) + 
        " has enjoyed " + userObj.count + " " + userObj.sipStr + "'s";
    
    if (userObj.count % 69 == 0 || userObj.count % 420 == 0) {
        msgString += ". Nice.";
    }

    if (userObj.count === 100) {
        msgString = "100 sips is a proud moment for any pisshead. Sir pisshead of sip, I hereby grant you one sipcoin and all the rights and lands associated with the title. Twizzle may not be the first, but he Flushed all the Jacksons in his way, and is thus the first owner of a sipcoin."
    }

    message.channel.send(msgString);
}

exports.handle = handle;
exports.injectConfig = injectConfig;