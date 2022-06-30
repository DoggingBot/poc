// ==========================================================
// =========== Setup our app and Configure ==================
// ==========================================================
//Setup CONFIG_FILE file
if (process.argv.length < 3) {
    //Assume default config
    configfile = "druncord_linux";
}
else {
    configfile = process.argv[2];
}

//Pull in our functional objects as constants
const CONFIG_FILE = require('./config/' + configfile);
const HELPERS = require('./helpers/helpers');

//instantiate our db connection manager
var dbManager = require('./managers/dbConnectionManager.js');

//if the db is unavailable, we cannot proceed
var serverCONFIGquery = {"select": "config", "columns":["*"], "where": "?", "orderby": "serverID", "values":[1]};
global.CONFIG = {servers:{},dbServer: CONFIG_FILE.dbServer, bot_name: CONFIG_FILE.bot_name};
global.RETORTS = {"select": "retorts", "columns":["*"], "where": "?", "values":[1]};
async function start() {
	rec = await dbManager.Query(serverCONFIGquery);
	rec.forEach((e) => {
		CONFIG.servers[e.serverID.toString()] = e;
	});
	CONFIG.servers = HELPERS.convertDataFromDB(CONFIG.servers,"cfg");
	
	rec = await dbManager.Query(RETORTS);
	RETORTS = [];
	rec.forEach((e) => {
		RETORTS.push(e.line);
	});
}
start().then(async () =>{
	//instantiate all our services
	var bufferService = require('./services/bufferService');
	var guildService = require('./services/guildService.js');
	var persistenceService = require('./services/persistenceService');
	var drunkTankService = require('./services/drunktankService');
	var tankStatsService = require('./services/tankStatsService');
	var inviteService = require('./services/inviteService');
	//var syncTankService = require('./services/syncTankService'); DEPRECATED AND REMOVED; uses DB now instead of DRP
	var commandParser = require('./commands/commandParser');

	/*Connect up all our services & CONFIGure them -- DEPRECATED AND REMOVED; CONFIG lives in global namespace of main.js
	bufferService.injectConfig(CONFIG);
	drunkTankService.injectConfig(CONFIG);
	persistenceService.injectConfig(CONFIG);
	guildService.injectConfig(CONFIG);
	commandParser.injectConfig(CONFIG);
	//syncTankService.injectConfig(CONFIG); DEPRECATED AND REMOVED; uses DB now instead of DRP
	tankStatsService.injectConfig(CONFIG);

	HELPERS.injectConfig(CONFIG);
  */
	
	//Log into our discord client
	const Discord = require("discord.js");
	// Possibly include a global of Permissions from Discord.js
	const client  = new Discord.Client({
		ws: { intents: Discord.Intents.ALL } 
	});
	client.login(CONFIG_FILE.access_key);

	//Notify we are starting up
	console.log(CONFIG_FILE.bot_name + " " + HELPERS.BOT_VERSION() + " starting up");
	console.log("Configuration: " + configfile);


	// ==========================================================
	// ==============Discord Client Events=======================
	// ==========================================================
	client.on("ready", () => {
		console.log(CONFIG_FILE.bot_name + " successfully started.\r\nReady!");
	});

	//// Default response in unconfigured server should be to run configure command.
	// Each event/command trigger should check the server for existing configuration
	async function serverConfigured(g,m) {
		if (
		(CONFIG.servers[g.id] == undefined) ||
		(CONFIG.servers[g.id].botMasterRole === null) ||
		(CONFIG.servers[g.id].botUserRole === null) ||
		(CONFIG.servers[g.id].drunktankRole === null) ||
		(CONFIG.servers[g.id].logChannel === null) ||
		(CONFIG.servers[g.id].tankChannel === null) ||
		(CONFIG.servers[g.id].invitesChannel === null) ||
		(CONFIG.servers[g.id].namesChannel === null) ||
		(CONFIG.servers[g.id].modlogChannel === null) ||
		(CONFIG.servers[g.id].startServer === false)
		) {
			if (!m) {
				let ch = g.channels.cache.get(g.systemChannelID);
				ch.send("This server hasn't been configured yet. Use the command `.configure` in a secure channel to begin configuration.");
			}
			return false;
		}
		return true;
	}
	//When a server invite is created
	client.on("inviteCreate", async (invite) => {
		if (serverConfigured(invite.guild)) {
			guildService.injectGuild(invite.guild);
			var command = require('./events/inviteEvent');
			//command.injectConfig(CONFIG); DEPRECATED AND REMOVED; CONFIG lives in global namespace of main.js
			return command.handle(invite, false);
		}
	});
	
	//When a server invite is deleted
	client.on("inviteDelete", async (invite) => {
		if (serverConfigured(invite.guild)) {
			guildService.injectGuild(invite.guild);
			var command = require('./events/inviteEvent');
			//command.injectConfig(CONFIG); DEPRECATED AND REMOVED; CONFIG lives in global namespace of main.js
			return command.handle(invite, true);
		}
	});
	
	//When an existing user is changed on the server
	client.on("userUpdate", async (o,n) => {
		// Only record username changes and only in servers the user can be found in
		var servers = [];
		Object.entries(CONFIG.servers).forEach(([serverID,cfg]) => {
			servers.push(serverID);
		});
		var command = require('./events/memberUpdateEvent');
		for (i = 0; i < servers.length; i++) {
			// Loop through each server. If configured, fetch guildMember of altered user,
			// then call memberUpdateEvent for userUpdate using that server.
			let guild = await o.client.guilds.fetch(servers[0]);
			if (serverConfigured(guild)) {
				guildService.injectGuild(guild);
				// is user in this guild?
				let guildMember = await guildService.getMemberForceLoad(o.id);
				if ((guildMember !== null) && (guildMember !== undefined)) {
					await command.handle(o,n, "userUpdate");
				}
			}
		}
		return;
	});
	
	//When an existing member is changed on the server
	client.on("guildMemberUpdate", async (o,n) => {
		if (serverConfigured(o.guild)) {
			guildService.injectGuild(o.guild);
			var command = require('./events/memberUpdateEvent');
			//command.injectConfig(CONFIG); DEPRECATED AND REMOVED; CONFIG lives in global namespace of main.js
			return command.handle(o,n,"guildMemberUpdate");
		}
	});

	//When a member joins the server
	client.on("guildMemberAdd", async (o) => {
		if (serverConfigured(o.guild)) {
			guildService.injectGuild(o.guild);
			var command = require('./events/memberJoinEvent');
			//command.injectConfig(CONFIG); DEPRECATED AND REMOVED; CONFIG lives in global namespace of main.js
			return command.handle(o);
		}
	});
	
	//When a member leaves the server
	client.on("guildMemberRemove", async (o) => {
		if (serverConfigured(o.guild)) {
			guildService.injectGuild(o.guild);
			var command = require('./events/memberLeaveEvent');
			//command.injectConfig(CONFIG); DEPRECATED AND REMOVED; CONFIG lives in global namespace of main.js
			return command.handle(o);
		}
	});
	
	//When a message is sent to the server
	client.on("message", async  (message) => {
		if (!message.guild) {
			if (message.author.id !== client.user.id) {
				let msg = HELPERS.fisherYates(RETORTS);
				return message.channel.send(msg[0]);
			}
		} else {
			if (message.author.id !== client.user.id) {
				// Prevents endless looped responses and checking on our own messages.
				guildService.injectGuild(message.guild);
				return commandParser.parseCommand(message,serverConfigured(message.guild,true));
			}
		}
	});
});