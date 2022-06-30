var guildService = require('../services/guildService');
var drunkTankService = require('../services/drunktankService');

const HELPERS = require('../helpers/helpers');
const MESSAGES = require('../helpers/messages');

/* DEPRECATED AND REMOVED; CONFIG lives in global namespace of main.js
var CONFIG;
function injectConfig(_cfg) {
    CONFIG = _cfg;
}
*/

async function handle(message) {
    msg = HELPERS.trimMsg(message);
		
		tokens = HELPERS.tokenize(msg.substr(1,msg.length -1 ));
		
		//Validate token length
    if (tokens.length < 2) {
        message.channel.send("Invalid arguments. Correct usage: " + CONFIG.servers[message.guild.id].commandPrefix + "tank @user reason");
        return;
    }
		
    var tankedMember = guildService.getMemberFromCache(message.mentions.users.first().id);
    var author = guildService.getMemberFromCache(message.author.id);
    var role = await guildService.getRole(CONFIG.servers[message.guild.id].drunktankRole);

    //Check if we have to handle customized timings
		var tankedFor = HELPERS.parseDurationFromTokens(tokens, message.guild.id);

    //Get a reason
    var reason = HELPERS.getReason(tankedFor.newTokens);
		
    //Make sure we have a reason
    if (!HELPERS.validateReason(reason, message)) {
        return;
    }
		
    //Make sure we have a mention on the message
    if (!HELPERS.validateMentions(message, "tank")) {
        return;
    }

    //actually tank the user
    return drunkTankService.tankUser(message.guild.id, tankedMember, author, reason, tankedFor.duration, tankedFor.uom)
        .then( (roles) => {
            msg = MESSAGES.confirm_tank_message(author, tankedMember, reason, role.name, roles.roles);
            return message.channel.send(msg);
        });
}

exports.handle = handle;
//exports.injectConfig = injectConfig;