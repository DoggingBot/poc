// ==========================================================
// =========== Setup our app and configure ==================
// ==========================================================
//Setup config file
if (process.argv.length < 3) {
    console.log("Please pass the config file as a parameter.");
    return;
}
configFile = process.argv[2];

//instantiate all our services
var guildService = require('./services/guildService');
var persistenceService = require('./services/persistenceService');
var drunkTankService = require('./services/drunktankService');

//Pull in our functional objects as constants
const CONFIG = require('../config/' + configFile);
const HELPERS = require('./helpers/helpers');

//Connect up all our services & configure them
drunkTankService.injectConfig(CONFIG, guildService);
persistenceService.injectConfig(CONFIG);
HELPERS.injectConfig(config);

//Log into our discord client
const Discord = require("discord.js");
const client  = new Discord.Client({
    ws: { intents: Discord.Intents.ALL } 
});
client.login(config.access_key);

//Notify we are starting up
console.log(config.bot_name + " " + HELPERS.BOT_VERSION + " starting up");
console.log("Configuration: " + configFile);


// ==========================================================
// ==============Discord Client Events=======================
// ==========================================================
client.on("ready", () => {
    console.log(config.bot_name + " successfully started.");
});

client.on("guildMemberUpdate", async (o,n) => {
    guildService.injectGuild(o.guild);

    var command = require('./events/memberUpdateEvent');
    return command.handle(o,n);
});


client.on("message", async  (message) => {
    guildService.injectGuild(message.guild);
    command.injectConfig(CONFIG)

    return handleMsg(message);
});



// =========================================================
// Handle a message & check if we need to execute a command 
// =========================================================
async function handleMsg(message) {
    // It will do nothing when the message doesnt start with the prefix
    if(!message.content.startsWith(config.commandPrefix)) return;

    //Also try and catch mistakes. Especially watch p as its used by the rhythm bot
    if (message.content.startsWith(config.commandPrefix + config.commandPrefix) ||
        message.content.startsWith(config.commandPrefix + "p") ||
        message.content.startsWith(config.commandPrefix + " ") 
    ) return;


    authorId = message.author.id;
    refreshedAuthorObj = guildService.getMemberForceLoad(authorId);

    //Verify the user has the right to user the bot
    if (!HELPERS.doesUserHaveRole(refreshedAuthorObj, config.botMasterRole)) {
        console.log ("UNAUTHORIZED USAGE ATTEMPT: " + message.author.username + " Tried to use me with this command: " + command);
        if (CONFIG.warnAuthorizedUsage)
            message.channel.send("You don't have the rights to use me you filthy swine.");
        return;
    }

    //Process our message
    commandStr = HELPERS.trimCommand(message);

    var command;

    switch (commandStr) {
        case "help":
            command = require('./commands/helpCommand');
            break;

        case "tank":
            command = require('./commands/tankCommand');
            break;

        case "untank":
            command = require('./commands/untankCommand');
            break;

        case "checktank":
            command = require('./commands/checkTankCommand');
            break;

        case "tankstats":
            command = require('./commands/tankStatsCommand');
            break;

        case "synctank":
            command = require('./commands/syncTankCommand');
            break;

        default:
            if (CONFIG.warnAuthorizedUsage)
                return message.channel.send("I don't know that command. Want me to build it? Do it yourself you lazy throbber");
            
            return;
    }

    command.injectConfig(CONFIG)
    return command.handle(message);
}
