
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

    message.channel.send(msgString);
}

exports.handle = handle;
exports.injectConfig = injectConfig;