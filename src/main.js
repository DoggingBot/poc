// ==========================================================
// =========== Setup our app and CONFIGure ==================
// ==========================================================
//Setup CONFIG file
if (process.argv.length < 3) {
    console.log("Please pass the CONFIG file as a parameter.");
    return;
}
configfile = process.argv[2];

//instantiate all our services
var guildService = require('./services/guildService.js');
var persistenceService = require('./services/persistenceService');
var drunkTankService = require('./services/drunktankService');
var tankStatsService = require('./services/tankStatsService');
var syncTankService = require('./services/syncTankService');
var commandParser = require('./commands/commandParser');

//Pull in our functional objects as constants
const CONFIG = require('./config/' + configfile);
const HELPERS = require('./helpers/helpers');

//Connect up all our services & CONFIGure them
drunkTankService.injectConfig(CONFIG, guildService);
persistenceService.injectConfig(CONFIG);
guildService.injectConfig(CONFIG);
commandParser.injectConfig(CONFIG);
syncTankService.injectConfig(CONFIG);
tankStatsService.injectConfig(CONFIG);

HELPERS.injectConfig(CONFIG);

//Log into our discord client
const Discord = require("discord.js");
const client  = new Discord.Client({
    ws: { intents: Discord.Intents.ALL } 
});
client.login(CONFIG.access_key);

//Notify we are starting up
console.log(CONFIG.bot_name + " " + HELPERS.BOT_VERSION + " starting up");
console.log("Configuration: " + configfile);


// ==========================================================
// ==============Discord Client Events=======================
// ==========================================================
client.on("ready", () => {
    console.log(CONFIG.bot_name + " successfully started.");
});

//When an existing member is changed on the server
client.on("guildMemberUpdate", async (o,n) => {
    guildService.injectGuild(o.guild);

    var command = require('./events/memberUpdateEvent');
    command.injectConfig(CONFIG);

    return command.handle(o,n);
});


client.on("message", async  (message) => {
    guildService.injectGuild(message.guild);

    return handleMsg(message);
});

// =========================================================
// Handle a message & check if we need to execute a command 
// =========================================================
async function handleMsg(message) {
    //Handle some events with auth
    if (CONFIG.countedStrings.includes(message.content.toLowerCase())) {
        //Handle command we don't need access for 
        command = require('./commands/sipCommand');
        command.injectConfig(CONFIG)
        return command.handle(message);
    }
    else if (message.content == ".sipstats") {
        command = require('./commands/sipStatsCommand');
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
        console.log ("UNAUTHORIZED USAGE ATTEMPT: " + message.author.username + " Tried to use me with this command: " + commandStr);
        if (CONFIG.warnAuthorizedUsage)
            message.channel.send("You don't have the rights to use me you filthy swine.");
        return;
    }

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
