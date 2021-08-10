// ==========================================================
// =========== Setup our app and Configure ==================
// ==========================================================
//Setup CONFIG file
if (process.argv.length < 3) {
    //Assume default config
    configfile = "testcfg";
}
else {
    configfile = process.argv[2];
}

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
drunkTankService.injectConfig(CONFIG);
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
console.log(CONFIG.bot_name + " " + HELPERS.BOT_VERSION() + " starting up");
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

//When a member joins the server
client.on("guildMemberAdd", async (o) => {
    guildService.injectGuild(o.guild);

    var command = require('./events/memberJoinEvent');
    command.injectConfig(CONFIG);

    return command.handle(o);
});

//When a member leaves the server
client.on("guildMemberRemove", async (o) => {
    guildService.injectGuild(o.guild);

    var command = require('./events/memberLeaveEvent');
    command.injectConfig(CONFIG);

    return command.handle(o);
});

//When a message is sent to the server
client.on("message", async  (message) => {
    guildService.injectGuild(message.guild);

    return commandParser.parseCommand(message);
});