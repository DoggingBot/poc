const HELPERS = require('../helpers/helpers');
const LOGGER = require('../helpers/logger');
var persistenceService = require('../services/persistenceService');
var guildService = require('../services/guildService.js');

/* DEPRECATED AND REMOVED; CONFIG lives in global namespace of main.js
var CONFIG;
function injectConfig(_cfg) {
    CONFIG = _cfg;
}
*/

async function parseCommand(message,configured) {
	// Responds to .configure only when not yet configured. Once configured, .config is needed.
	if (configured) {
		var cfg = CONFIG.servers[message.guild.id];				
		var countedStrings = await persistenceService.getAllSips(message.guild.id);
		countedStrings = countedStrings.structure; // set to only the columns
		countedStrings.splice(0,2); // remove the first column 'userId & lastSip'
    //Handle some events with auth
    if (countedStrings.includes(message.content.toLowerCase())) {
        //Handle command we don't need access for 
        command = require('./sipCommand');
        //command.injectConfig(cfg) DEPRECATED AND REMOVED; CONFIG lives in global namespace of main.js
        return command.handle(message);
    }
    else if (message.content == ".sipstats") {
        command = require('./sipStatsCommand');
        //command.injectConfig(cfg) DEPRECATED AND REMOVED; CONFIG lives in global namespace of main.js
        return command.handle(message);
    }   
    // It will do nothing when the message doesn't start with the prefix
    if(!message.content.startsWith(cfg.commandPrefix)) return;
    //Also try and catch mistakes. Especially watch p as its used by the rhythm bot
    if (message.content.startsWith(cfg.commandPrefix + cfg.commandPrefix) ||
        message.content.startsWith(cfg.commandPrefix + "p") ||
        message.content.startsWith(cfg.commandPrefix + " ") 
    ) return;   
    authorId = message.author.id;
    var refreshedAuthorObj = await guildService.getMemberForceLoad(authorId);   
    //Process our message
    var commandStr = HELPERS.trimCommand(message);  
    //Verify the user has the right to use the bot
    let hasRightToUse = false;
    if (
        refreshedAuthorObj._roles.includes(cfg.botUserRole) ||
        message.member.permissions.has(1 << 3) ||
        refreshedAuthorObj._roles.includes(cfg.botMasterRole)
    ) {
        hasRightToUse = true;
    }
    if (!hasRightToUse) {
        LOGGER.log("UNAUTHORIZED USAGE ATTEMPT: <@" + authorId + "> (" + message.author.tag + ") (" + authorId + ") Tried to use me with this command: " + commandStr);
        if (cfg.warnAuthorizedUsage)
            message.channel.send("You don't have the rights to use me you filthy swine!");
        return;
    }
    var command;
    switch (commandStr) {
        case "help":
            command = require('./helpCommand');
            break;  
        case "tank":
            command = require('./tankCommand');
            break;  
        case "untank":
            command = require('./untankCommand');
            break;  
        case "checktank":
            command = require('./checkTankCommand');
            break;  
        case "tankstats":
            command = require('./tankStatsCommand');
            break; 
				case "config":
				    command = require('./configCommand');
						break;
        /*case "synctank":
            command = require('./syncTankCommand');
            break;  DEPRECATED AND REMOVED; uses DB now instead of DRP */
        default:
            if (cfg.warnAuthorizedUsage) {
              return message.channel.send("I don't know that command. Want me to build it? Do it yourself you lazy throbber");
						}
            return;
    }   
    //command.injectConfig(CONFIG) DEPRECATED AND REMOVED; CONFIG lives in global namespace of main.js
    return command.handle(message); 
	} else {
		var prefix = ".";
		// Is there any server config set?
		if (CONFIG.servers[message.guild.id] !== undefined) { // avoids undefined property read error.
			if (
				(CONFIG.servers[message.guild.id].commandPrefix !== null) && 
				(typeof CONFIG.servers[message.guild.id].commandPrefix !== "undefined")
			) {
				prefix = CONFIG.servers[message.guild.id].commandPrefix;
			}
		}
		// Was the command `.configure`?
		if (message.content.startsWith(prefix + "configure")) {
			// THIS IS THE ONLY COMMAND WE WILL RESPOND TO WHEN ITS FROM AN UNCONFIGURED SERVER
			// First make sure the configuring user has ADMINISTRATOR here.
			if (!message.member.permissions.has(1 << 3)) {
				return; // Don't even acknowledge the message.
			}
			// call the default configure function
			command = require('./configCommand');
			return command.configure(message, prefix);
		}
		return; // Ignore the message, wasn't for the bot.
	}
}

//exports.injectConfig = injectConfig;
exports.parseCommand = parseCommand;