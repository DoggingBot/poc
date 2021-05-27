
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
    msg = HELPERS.trimMsg(message);

    var tankedMemberId = message.mentions.users.first().id;
    var author =  guildService.getMemberFromCache(message.author.id);
    var role = guildService.getRole(CONFIG.drunktankRole);

    tokens = HELPERS.tokenize(msg.substr(1,msg.length -1 ));

    //Validate token length
    if (tokens.length < 2) {
        message.channel.send("Invalid arguments. Correct usage: &&tank @user reason");
        return;
    }

    //Check if we have to handle customized timings
	var tankedFor = HELPERS.parseDurationFromTokens(tokens);

    //Get a reason
    var reason = HELPERS.getReason(tankedFor.newTokens);
		
    //Make sure we have a reason
    if (!HELPERS.validateReason(reason, message)) {
        return;
    }
    //Make sure we have a mention on the message
    if (!HELPERS.validateMentions(message, "tank", config.commandPrefix)) {
        return;
    }

    //actually tank the user
    return drunkTankService.tankUser(tankedMemberId, author.id, reason, tankedFor.duration, tankedFor.uom)
        .then( (roles) => {
            msg = MESSAGES.confirm_message(author.nickname, HELPERS.getAtString(tankedMemberId), reason, role.name, roles);
            return message.channel.send(msg);
        });
}

exports.handle = handle;
exports.injectConfig = injectConfig;