const HELPERS = require('../helpers/helpers');
const LOGGER = require('../helpers/logger');

var guildService = require('../services/guildService.js');

var CONFIG;
function injectConfig(_cfg) {
    CONFIG = _cfg;
}

async function parseCommand(message) {
    //Handle some events with auth
    if (CONFIG.countedStrings.includes(message.content.toLowerCase())) {
        //Handle command we don't need access for 
        command = require('./sipCommand');
        command.injectConfig(CONFIG)
        return command.handle(message);
    }
    else if (message.content == ".sipstats") {
        command = require('./sipStatsCommand');
        command.injectConfig(CONFIG)
        return command.handle(message);
    }   
    // It will do nothing when the message doesnt start with the prefix
    if(!message.content.startsWith(CONFIG.commandPrefix)) return;   
    //Also try and catch mistakes. Especially watch p as its used by the rhythm bot
    if (message.content.startsWith(CONFIG.commandPrefix + CONFIG.commandPrefix) ||
        message.content.startsWith(CONFIG.commandPrefix + "p") ||
        message.content.startsWith(CONFIG.commandPrefix + " ") 
    ) return;   
    authorId = message.author.id;
    refreshedAuthorObj = await guildService.getMemberForceLoad(authorId);   
    //Process our message
    commandStr = HELPERS.trimCommand(message);  
    //Verify the user has the right to user the bot
    if (!HELPERS.doesUserHaveRole(refreshedAuthorObj, CONFIG.botMasterRole)) {
        LOGGER.log("UNAUTHORIZED USAGE ATTEMPT: " + message.author.username + " Tried to use me with this command: " + commandStr);
        if (CONFIG.warnAuthorizedUsage)
            message.channel.send("You don't have the rights to use me you filthy swine.");
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
        case "synctank":
            command = require('.    /syncTankCommand');
            break;  
        default:
            if (CONFIG.warnAuthorizedUsage)
                return message.channel.send("I don't know that command. Want me to build it? Do it yourself you lazy throbber");

            return;
    }   
    command.injectConfig(CONFIG)
    return command.handle(message); 
}

exports.injectConfig = injectConfig;
exports.parseCommand = parseCommand;