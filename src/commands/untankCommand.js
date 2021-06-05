
var guildService = require('../services/guildService');
var drunkTankService = require('../services/drunktankService');
var persistenceService = require('../services/persistenceService');

const HELPERS = require('../helpers/helpers');
const MESSAGES = require('../helpers/messages');

var CONFIG;
function injectConfig(_cfg) {
    CONFIG = _cfg;
}

async function handle(message) {
    msg = HELPERS.trimMsg(message);

    tokens = HELPERS.tokenize(msg.substr(1,msg.length -1 ));
        
    if (tokens.length < 1) {
        message.channel.send("Invalid arguments. Correct usage: " + CONFIG.commandPrefix + "untank @user optionalreason");
        return;
    }
    var reason = HELPERS.getReason(tokens);
    if (!HELPERS.validateMentions(message, "untank", CONFIG.commandPrefix)) {
        return;
    }
    if (reason.replace(/[^A-Za-z0-9]/g, '') == "") {
        reason = "Default - assume time served.";
    }

    var tankedMemberId = message.mentions.users.first().id;
    var author =  guildService.getMemberFromCache(message.author.id);

    userJson = persistenceService.getUser(tankedMemberId);

    if (userJson == undefined){
        //dont do anything if they are not in our log. we might strip them of their roles by accident.
        return message.channel.send("User not found in tank log. Do it manually or run tanksync please.");
    }

    return drunkTankService.untankUser(tankedMemberId, author.id, userJson)
        .then((rolesGivenBack)=> {
            msg = MESSAGES.confirm_untank_message(author.nickname, HELPERS.getAtString(tankedMemberId), reason, rolesGivenBack.roles);
            return message.channel.send(msg);
        });
}

exports.handle = handle;
exports.injectConfig = injectConfig;