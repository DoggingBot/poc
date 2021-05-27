
var guildService = require('../services/guildService');
var drunkTankService = require('../services/drunktankService');

const HELPERS = require('../helpers/helpers');
const MESSAGES = require('../helpers/messages');

var CONFIG;
function injectConfig(_cfg, guildSvc) {
    CONFIG = _cfg;
    guildService = guildSvc;
}

async function handle(message) {
    tokens = HELPERS.tokenize(msg.substr(1,msg.length -1 ));
        
    if (tokens.length < 1) {
        message.channel.send("Invalid arguments. Correct usage: &&untank @user optionalreason");
        return;
    }
    var reason = HELPERS.getReason(tokens);
    if (!HELPERS.validateMentions(message, "untank", config.commandPrefix)) {
        return;
    }
    if (reason.replace(/[^A-Za-z0-9]/g, '') == "") {
        reason = "Default - assume time served.";
    }

    var tankedMemberId = message.mentions.users.first().id;
    var author =  guildService.getMemberFromCache(message.author.id);

    userJson = persistence.getUser(untankedMember.user.id);

    if (userJson == undefined){
        //dont do anything if they are not in our log. we might strip them of their roles by accident.
        return message.channel.send("User not found in tank log. Do it manually or run tanksync please.");
    }

    return drunkTankService.untankUser(tankedMemberId, author.id, userJson)
        .then((rolesGivenBack)=> {
            msg = MESSAGES.confirm_untank_message(author.nickname, HELPERS.getAtString(tankedMemberId), reason, rolesGivenBack);
            return message.channel.send(msg);
        });
}

exports.handle = handle;
exports.injectConfig = injectConfig;