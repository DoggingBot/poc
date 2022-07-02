const path = require("path");
const fs = require("fs-then-native");

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
global.HELPERS = {};
global.EVENTS = {};
global.SERVICES = {};
global.MANAGERS = {};
global.COMMANDS = {};
global.DEVELOPER = {};

var serverCONFIGquery = {"select": "config", "columns":["*"], "where": "?", "orderby": "serverID", "values":[1]};
global.CONFIG = {servers:{},dbServer: CONFIG_FILE.dbServer, bot_name: CONFIG_FILE.bot_name};
global.RETORTS = {"select": "retorts", "columns":["*"], "where": "?", "values":[1]};

async function start() {
	await handleAfterMessage("RELOAD");
}

start().then(async () => {
	//if the db is unavailable, we cannot proceed
	rec = await MANAGERS.dbConnectionManager.Query(serverCONFIGquery);
	rec.forEach((e) => {
		CONFIG.servers[e.serverID.toString()] = e;
	});
	CONFIG.servers = HELPERS.helpers.convertDataFromDB(CONFIG.servers,"cfg");
	
	rec = await MANAGERS.dbConnectionManager.Query(RETORTS);
	RETORTS = [];
	rec.forEach((e) => {
		RETORTS.push(e.line);
	});
})
.then(async () =>{
	//Log into our discord client
	const {Client, Intents} = require("discord.js");
	// Possibly include a global of Permissions from Discord.js
	const BotIntents = new Intents();
	BotIntents.add(
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_BANS,
		Intents.FLAGS.GUILD_INVITES,
		Intents.FLAGS.GUILD_VOICE_STATES,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.DIRECT_MESSAGES,
		Intents.FLAGS.MESSAGE_CONTENT
	);
	const client  = new Discord.Client({intents: BotIntents});
	client.login(CONFIG_FILE.access_key);

	//Notify we are starting up
	console.log(CONFIG_FILE.bot_name + " " + HELPERS.helpers.BOT_VERSION() + " starting up");
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
			SERVICES.guildService.injectGuild(invite.guild);
			return EVENTS.inviteEvent.handle(invite, false);
		}
	});
	
	//When a server invite is deleted
	client.on("inviteDelete", async (invite) => {
		if (serverConfigured(invite.guild)) {
			SERVICES.guildService.injectGuild(invite.guild);
			return EVENTS.inviteEvent.handle(invite, true);
		}
	});
	
	//When an existing user is changed on the server
	client.on("userUpdate", async (o,n) => {
		// Only record username changes and only in servers the user can be found in
		var servers = [];
		Object.entries(CONFIG.servers).forEach(([serverID,cfg]) => {
			servers.push(serverID);
		});
		for (i = 0; i < servers.length; i++) {
			// Loop through each server. If configured, fetch guildMember of altered user,
			// then call memberUpdateEvent for userUpdate using that server.
			let guild = await o.client.guilds.fetch(servers[0]);
			if (serverConfigured(guild)) {
				SERVICES.guildService.injectGuild(guild);
				// is user in this guild?
				let guildMember = await SERVICES.guildService.getMemberForceLoad(o.id);
				if ((guildMember !== null) && (guildMember !== undefined)) {
					await EVENTS.memberUpdateEvent.handle(o,n, "userUpdate");
				}
			}
		}
		return;
	});

	client.on("messageUpdate", async (oldMessage,newMessage) => {
		if (CONFIG.servers[oldMessage.guild.id].mentionsLog !== null) {
			SERVICES.guildService.injectGuild(oldMessage.guild);
			return await EVENTS.messageUpdateEvent.mentionEdit(oldMessage,newMessage);
		} else {
			return;
		}
	});

	client.on("messageDelete", async (message) => {
		if (CONFIG.servers[message.guild.id].mentionsLog !== null) {
			SERVICES.guildService.injectGuild(message.guild);
			return await EVENTS.messageUpdateEvent.mentionEdit(message,false);
		} else {
			return;
		}
	});
	
	client.on("voiceStateUpdate", async (o,n) =>{
		if (serverConfigured(o.guild)) {
			SERVICES.guildService.injectGuild(o.guild);
			return EVENTS.voiceStateUpdateEvent.handle(o,n);
		}
	});
	
	//When an existing member is changed on the server
	client.on("guildMemberUpdate", async (o,n) => {
		if (serverConfigured(o.guild)) {
			SERVICES.guildService.injectGuild(o.guild);
			return EVENTS.memberUpdateEvent.handle(o,n,"guildMemberUpdate");
		}
	});

	//When a member joins the server
	client.on("guildMemberAdd", async (o) => {
		if (serverConfigured(o.guild)) {
			SERVICES.guildService.injectGuild(o.guild);
			return EVENTS.memberJoinEvent.handle(o);
		}
	});
	
	//When a member leaves the server
	client.on("guildMemberRemove", async (o) => {
		if (serverConfigured(o.guild)) {
			SERVICES.guildService.injectGuild(o.guild);
			return EVENTS.memberLeaveEvent.handle(o);
		}
	});
	
	//When a message is sent to the server
	client.on("messageCreate", async (message) => {
		if (!message.guild) {
			if (message.author.id !== client.user.id) {
				await SERVICES.dmService.respondDM(message)
				.then((response)=>{
					handleAfterMessage(response);
				});
			}
		} else {
			SERVICES.guildService.injectGuild(message.guild); // so we can use the guildService to check if the user is a bypassing user
			var isBypasser = await SERVICES.guildService.isBypassingGMU(message.author);
			if (!isBypasser) {
				// Prevents endless looped responses on our own messages, and ignores any message from a bypassing member.
				await SERVICES.commandService.parseCommand(message,serverConfigured(message.guild,true))
				.then(async (response)=>{
					await handleAfterMessage(response);
				});
			} else {
				// Druncord Exclusive - allow Mee6 Premium bot to trigger specific commands
				if (message.author == "821425253002903595") {
					switch (message.content.toLowerCase()) {
						case "sip":
							await SERVICES.commandService.parseCommand(message,serverConfigured(message.guild,true));
							break;
						default:
							// Ignore it.
					}
				}
			}
		}
	});
});

async function handleAfterMessage(action) {
	if (action === "RELOAD") {
		console.log("Reload requested");
		// Include any new services, events, helpers, managers, or commands, and update anything that may have changed.
		await fs.readdir(path.resolve("./services"))
		.then(files => {
			for (let f of files) {
				if (path.extname(f) === ".js") {
					SERVICES[f.replace(".js","")] = require("./services/" + f);
				}
			}
		})
		.then(()=>{
			Object.entries(SERVICES).forEach((s) =>{
				delete require.cache[require.resolve(path.join(__dirname,"services",s[0]))];
				SERVICES[s[0]] = require(path.join(__dirname,"services",s[0]));
			});
		})
		.catch(err => {
			return console.log("Unable to scan directory: services. " + err);
		});

		await fs.readdir(path.resolve("./events"))
		.then(files => {
			for (let f of files) {
				if (path.extname(f) === ".js") {
					EVENTS[f.replace(".js","")] = require("./events/" + f);
				}
			}
		})
		.then(()=>{
			Object.entries(EVENTS).forEach((e) =>{
				delete require.cache[require.resolve(path.join(__dirname,"events",e[0]))];
				EVENTS[e[0]] = require(path.join(__dirname,"events",e[0]));
			});
		})
		.catch(err => {
				return console.log("Unable to scan directory: events. " + err);
		});
		await fs.readdir(path.resolve("./helpers"))
		.then(files => {
			for (let f of files) {
				if (path.extname(f) === ".js") {
					HELPERS[f.replace(".js","")] = require("./helpers/" + f);
				}
			}
		})
		.then(()=>{
			Object.entries(HELPERS).forEach((h) =>{
				delete require.cache[require.resolve(path.join(__dirname,"helpers",h[0]))];
				HELPERS[h[0]] = require(path.join(__dirname,"helpers",h[0]));
			});
		})
		.catch(err => {
				return console.log("Unable to scan directory: helpers. " + err);
		});
		await fs.readdir(path.resolve("./managers"))
		.then(files => {
			for (let f of files) {
				if (path.extname(f) === ".js") {
					MANAGERS[f.replace(".js","")] = require("./managers/" + f);
				}
			}
		})
		.then(()=>{
			Object.entries(MANAGERS).forEach((m) =>{
				delete require.cache[require.resolve(path.join(__dirname,"managers",m[0]))];
				MANAGERS[m[0]] = require(path.join(__dirname,"managers",m[0]));
			});
		})
		.catch(err => {
				return console.log("Unable to scan directory: managers. " + err);
		});
		await fs.readdir(path.resolve("./commands"))
		.then(files => {
			for (let f of files) {
				if (path.extname(f) === ".js") {
					COMMANDS[f.replace(".js","")] = require("./commands/" + f);
				}
			}
		})
		.then(()=>{
			Object.entries(COMMANDS).forEach((c) =>{
				delete require.cache[require.resolve(path.join(__dirname,"commands",c[0]))];
				COMMANDS[c[0]] = require(path.join(__dirname,"commands",c[0]));
			});
		})
		.catch(err => {
				return console.log("Unable to scan directory: commands. " + err);
		});
		await fs.readdir(path.resolve("./developer"))
		.then(files => {
			for (let f of files) {
				if (path.extname(f) === ".js") {
					DEVELOPER[f.replace(".js","")] = require("./developer/" + f);
				}
			}
		})
		.then(()=>{
			Object.entries(DEVELOPER).forEach((d) =>{
				delete require.cache[require.resolve(path.join(__dirname,"developer",d[0]))];
				DEVELOPER[d[0]] = require(path.join(__dirname,"developer",d[0]));
			});
		})
		.catch(err => {
				return console.log("Unable to scan directory: developer. " + err);
		});
	}
}