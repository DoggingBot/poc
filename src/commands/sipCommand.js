
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

    var trailing_s = ""
    if (userObj.count > 1) {
        trailing_s = "s"
    }

    var msgString = HELPERS.getAtString(userObj.userID) + 
        " has enjoyed " + userObj.count + " " + userObj.sipStr + trailing_s;

    if (userObj.count % 69 == 0 || userObj.count % 420 == 0) {
        msgString += ". Nice.";
    }

    if (userObj.count == 42) {
        msgString = "Sipping 42 sips is the answer to the ultimate Question of life, the universe, and everything"
    }

    else {
        if (userObj.count == 100) {
            msgString = "100 " +userObj.sipStr +"s is a proud moment for any pisshead. ";
        }
        else {
            if (Math.floor((Math.random() * 100) + 1) == 50) {
                //make one in every 100 say something else
                msgString = "You take a sip from your trusty vault 13 canteen.";
            }
        }
    }

    message.channel.send(msgString);
}

exports.handle = handle;
exports.injectConfig = injectConfig;