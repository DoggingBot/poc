function help(prefix) {
    return prefix + "config - configures various settings. Use `" + prefix + "config help` for more info.\r\n";
}

async function configure(m,p) {
	// THIS COMMAND SHOULD ONLY RUN ON AN UNCONFIGURED SERVER AND ONLY BY AN ADMINISTRATOR.
	// ACCESS TO THIS COMMAND IS OTHERWISE IMPOSSIBLE. DO NOT MAKE IT AVAILABLE.
	
	// DEFAULT SERVER CONFIGURATIONS
	var cfg = {
		serverID: m.guild.id, // DB alteration ID => Id
		commandPrefix: ".",
		botMasterRole: null,
		modUserRole: null,
		botUserRole: null,
		uncountedLimitRole: null,
		drunktankRole: null,
		minorRole: null,
		verifiedRole: null,
		tankChannel: m.channel.id,
		minorChannel: m.channel.id,
		logChannel: m.channel.id,
		invitesChannel: m.channel.id,
		mentionsLog: m.channel.id,
		namesChannel: m.channel.id,
		modlogChannel: m.channel.id,
		bypassGMU: m.client.user.id,
		rolesToIgnore: null,
		rolesICannotTank: null,
		tankUOM: "hours",
		tankDuration: 12,
		verifyAgeBy: 120,
		writeMessageToDrunkTank: false,
		warnAuthorizedUsage: false,
		startServer: false
	};
	
	// check if Server Booster role is set
	if (!!m.guild.roles.premiumSubscriberRole) {
		cfg.rolesToIgnore = m.guild.roles.premiumSubscriberRole.id;
	}
	
	// FINAL CHECK TO ENSURE THAT THE SERVER DOESN'T YET EXIST IN THE DB WHEN CALLING THE EMPTY COMMAND `.CONFIGURE`.
	if ((m.content === p + "configure") && (!CONFIG.servers[m.guild.id])) {
		// Create the server config
		var queryConfig = {
			insert: "config",
			columns: Object.keys(cfg),
			valueHolders: [],
			values: Object.values(cfg)
		};
		Object.keys(cfg).forEach((a)=>{
			queryConfig.valueHolders.push("?");
		});
		queryConfig.valueHolders.join(",");
		queryConfig.valueHolders = "(" + queryConfig.valueHolders + ")";
		
		var queryTankees = {
			create: m.guild.id + "_tankees",
			columns: [
				"`time_tanked` BIGINT(14) UNSIGNED NOT NULL PRIMARY KEY",
				"`user_tanked` VARCHAR(20) NOT NULL",
				"`tanked_by` VARCHAR(20) NOT NULL",
				"`tank_reason` VARCHAR(1990) NULL",
				"`time_to_untank` BIGINT(14) UNSIGNED NOT NULL",
				"`roles_to_give_back` VARCHAR(2099) NOT NULL",
				"`time_untanked` BIGINT(14) UNSIGNED NULL",
				"`untanked_by` VARCHAR(20) NULL",
				"`untanked_reason` VARCHAR(1990) NULL"
			]
		};
		
		var queryAgeVerify = {
			create: m.guild.id + "_ageVerify",
			columns: [
				"`time` BIGINT(14) UNSIGNED NOT NULL PRIMARY KEY",
				"`user` VARCHAR(20) NOT NULL",
				"`staff_user` VARCHAR(20) NOT NULL",
				"`ban_by` BIGINT(14) UNSIGNED NOT NULL",
				"`roles_to_give_back` VARCHAR(2099) NOT NULL"
			]
		};

		var queryBuffers = {
			create: m.guild.id + "_buffers",
			columns: [
				"`id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY",
				"`time` BIGINT(14) UNSIGNED NOT NULL",
				"`channel` VARCHAR(7) NOT NULL",
				"`msg` VARCHAR(16384) NOT NULL"
			]
		};
		
		var querySips = {
			create: m.guild.id + "_sips",
			columns: [
			  "`userId` VARCHAR(20) NOT NULL PRIMARY KEY",
				"`lastSip` BIGINT(14) UNSIGNED NOT NULL",
				"`sip` INT(10) UNSIGNED NOT NULL"
			]
		};
		
		var queryInvites = {
			create: m.guild.id + "_invites",
			columns: [
				"`code` VARCHAR(25) NOT NULL PRIMARY KEY",
				"`inviter` VARCHAR(20) NOT NULL",
				"`uses` INT UNSIGNED NOT NULL",
				"`dummies` INT UNSIGNED NOT NULL",
				"`deleted` TINYINT(1) UNSIGNED NOT NULL"
			]
		};
		
		var queryInviteUses = {
			create: m.guild.id + "_invite_uses",
			columns: [
				"`joined` BIGINT(14) UNSIGNED NOT NULL PRIMARY KEY",
				"`code` VARCHAR(25) NOT NULL",
				"`user` VARCHAR(20) NOT NULL"
			]
		};
		
		await MANAGERS.dbConnectionManager.Query(queryConfig);
		await MANAGERS.dbConnectionManager.Query(queryTankees);
		await MANAGERS.dbConnectionManager.Query(queryAgeVerify);
		await MANAGERS.dbConnectionManager.Query(queryBuffers);
		await MANAGERS.dbConnectionManager.Query(querySips);
		await MANAGERS.dbConnectionManager.Query(queryInvites);
		await MANAGERS.dbConnectionManager.Query(queryInviteUses);
		
		await reloadConfig(m.guild.id);
		var msg = "";
		if (CONFIG.servers[m.guild.id].serverID = m.guild.id) { // DB alteration ID => Id
			msg = "Server initial configuration successful." +
			  "\r\nYour current Configuration: " + 
		    	"\r\n```" +
				'\r\ncommandPrefix: .' +
				'\r\nbotMasterRole: **NOT SET**' +
				'\r\nmodUserRole: **NOT SET**' +
				'\r\nbotUserRole: **NOT SET**' +
				'\r\nuncountedLimitRole: **NOT SET**' +
				'\r\ndrunktankRole: **NOT SET**' +
				'\r\nminorRole: **NOT SET**' +
				'\r\nverifiedRole: **NOT SET**' +
				'\r\ntankChannel: ' + CONFIG.servers[m.guild.id].tankChannel +
				'\r\nminorChannel: ' + CONFIG.servers[m.guild.id].minorChannel +
				'\r\nlogChannel: ' + CONFIG.servers[m.guild.id].logChannel +
				'\r\ninvitesChannel: ' + CONFIG.servers[m.guild.id].invitesChannel +
				'\r\nmentionsLog: ' + CONFIG.servers[m.guild.id].mentionsLog +
				'\r\nnamesChannel: ' + CONFIG.servers[m.guild.id].namesChannel +
				'\r\nmodlogChannel: ' + CONFIG.servers[m.guild.id].modlogChannel +
				'\r\nbypassGMU: ' + CONFIG.servers[m.guild.id].bypassGMU +
				'\r\nrolesToIgnore: ' + (CONFIG.servers[m.guild.id].rolesToIgnore === null ? '**NOT SET**' : CONFIG.servers[m.guild.id].rolesToIgnore) +
				'\r\nrolesICannotTank: **NOT SET**' +
				'\r\ntankUOM: hours' +
				'\r\ntankDuration: 12' +
				'\r\nverifyAgeBy: 120' +
				'\r\nwriteMessageToDrunkTank: no' +
				'\r\nwarnAuthorizedUsage: no' +
				"\r\n```" +
				"\r\nYou can set individual items using `.configure <setting> set|add|remove <value>`" +
				"\r\n(add|remove only for bypassGMU, rolesToIgnore, rolesICannotTank)\r\n" +
				
				"\r\nYou **must** set a botMasterRole, botUserRole, drunktankRole, and minorRole before you can start the bot fully. The Channel configs are *recommended* to be different channels.\r\n" +
		 
				"\r\nUse raw Ids for all roles, users, and channels." +
				"\r\nUse 0 (false) or 1 (true) for any true/false/yes/no values." +
				"\r\nType `.configure <setting> help` for additional information." +
				"\r\nExecute the command `.configure start` to confirm configuration and begin the bot.";
		} else {
			msg = "Server initial configuration failed. If this continues, contact the Bot Developer.";
		}
		return m.channel.send(msg);
	} else {
		// Listening for next configurations without starting server
		return resolveCommand(m);
	}
}

async function resolveCommand(message) {
	// .configure and .config will both redirect here. We allow .configure to change settings whilst the server has not started, but it will change over to .config once started.
	// .config cannot alter startServer.
	var command = HELPERS.helpers.trimCommand(message);
	var tokens = HELPERS.helpers.trimMsg(message);
	tokens = HELPERS.helpers.tokenize(tokens.substr(1,tokens.length -1));
	var setting = tokens[0];
	tokens.slice(1);
	var msg = "";
	if ((setting === "start") && (command === "configure")) {
		// Bot requires that these are configured first
		if (CONFIG.servers[message.guild.id].botMasterRole === null) {
			return message.channel.send("You must configure the botMasterRole.");
		}
		if (CONFIG.servers[message.guild.id].botUserRole === null) {
			return message.channel.send("You must configure the botUserRole.");
		}
		if (CONFIG.servers[message.guild.id].drunktankRole === null) {
			return message.channel.send("You must configure the drunktankRole.");
		}
		if (CONFIG.servers[message.guild.id].minorRole === null) {
			return message.channel.send("You must configure the minorRole.");
		}
		var queryConfig = {
			update: "config",
			sets: "startServer = ?",
			where: "serverID = ?", // DB alteration ID => Id
			values: [true, message.guild.id]
		};
		
		await MANAGERS.dbConnectionManager.Query(queryConfig);
		await reloadConfig(message.guild.id);
		if (CONFIG.servers[message.guild.id].startServer) {
			msg = "Server Configuration successfully loaded and started.";
		} else {
			msg = "Server initial configuration failed. If this continues, contact the Bot Developer.";
		}
		return message.channel.send(msg);
		
	}
	var result = -1;
	switch (setting) {
		case "commandPrefix":
			switch (tokens[1]) {
				case "set":
					if (tokens[2].length !== 1) {
						msg += "Command Prefix must be a single character.";
					} else {
						result = await updateConfig(message.guild.id, setting, tokens[2].toString());
					}
				  break;
				case "help":
					msg += setting + ": " + CONFIG.servers[message.guild.id][setting] +
					"\r\nInfo: Changes the command prefix for the bot.";
				  break;
				default:
				  msg += "Invalid argument. Correct Usage: `" + 
					CONFIG.servers[message.guild.id].commandPrefix + command + " " + setting + " set <char>`";
					break;
			}
			break;
		case "botMasterRole":
		  switch (tokens[1]) {
				case "set":
				  let id = await message.guild.roles.fetch(tokens[2]);
					if (id === null) {
						msg += "That role doesn't exist.";
					} else {
						result = await updateConfig(message.guild.id, setting, tokens[2]);
					}
				  break;
				case "help":
					msg += setting + ": " + CONFIG.servers[message.guild.id][setting] +
					"\r\nInfo: Sets the role needed to configure the bot. Accepts a role Id. Anyone with Administrator Permission is also a Bot Master.";
				  break;
				default:
				  msg += "Invalid argument. Correct Usage: `" + 
					CONFIG.servers[message.guild.id].commandPrefix + command + " " + setting + " set <roleId>`";
					break;
			}
			break;
		case "modUserRole":
		  switch (tokens[1]) {
				case "set":
				  let id = await message.guild.roles.fetch(tokens[2]);
					if (id === null) {
						msg += "That role doesn't exist.";
					} else {
						result = await updateConfig(message.guild.id, setting, tokens[2]);
					}
				  break;
				case "help":
					msg += setting + ": " + CONFIG.servers[message.guild.id][setting] +
					"\r\nInfo: Sets the role that is considered above normal botUsers. Accepts a role Id. Anyone with Administrator Permission is also a Mod User. **OPTIONAL**";
				  break;
				default:
				  msg += "Invalid argument. Correct Usage: `" + 
					CONFIG.servers[message.guild.id].commandPrefix + command + " " + setting + " set <roleId>`";
					break;
			}
			break;
		case "botUserRole":
			switch (tokens[1]) {
				case "set":
					let id = await message.guild.roles.fetch(tokens[2]);
					if (id === null) {
						msg += "That role doesn't exist.";
					} else {
						result = await updateConfig(message.guild.id, setting, tokens[2]);
					}
				  break;
				case "help":
					msg += setting + ": " + CONFIG.servers[message.guild.id][setting] +
					"\r\nInfo: Sets the role needed to run bot commands (except configuration). Accepts a role Id. Anyone with Administrator Permission is also a Bot User.";
				  break;
				default:
				  msg += "Invalid argument. Correct Usage: `" + 
					CONFIG.servers[message.guild.id].commandPrefix + command + " " + setting + " set <roleId>`";
					break;
			}
			break;
		case "uncountedLimitRole":
			switch (tokens[1]) {
				case "set":
					let id = await message.guild.roles.fetch(tokens[2]);
					if (id === null) {
						msg += "That role doesn't exist.";
					} else {
						result = await updateConfig(message.guild.id, setting, tokens[2]);
					}
				  break;
				case "help":
					msg += setting + ": " + CONFIG.servers[message.guild.id][setting] +
					"\r\nInfo: Sets the role that doesn't count towards saved limits on channels. Accepts a role Id. Don't use a role that is used in any other configuration. All botUsers, modUsers, the botMaster, and all Administrators are uncounted.";
				  break;
				default:
				  msg += "Invalid argument. Correct Usage: `" + 
					CONFIG.servers[message.guild.id].commandPrefix + command + " " + setting + " set <roleId>`";
					break;
			}
			break;
		case "drunktankRole":
			switch (tokens[1]) {
				case "set":
					let id = await message.guild.roles.fetch(tokens[2]);
					if (id === null) {
						msg += "That role doesn't exist.";
					} else {
						result = await updateConfig(message.guild.id, setting, tokens[2]);
					}
				  break;
				case "help":
					msg += setting + ": " + CONFIG.servers[message.guild.id][setting] +
					"\r\nInfo: Sets the DrunkTank role that the bot will give to users when they are tanked. Accepts a role Id.";
				  break;
				default:
				  msg += "Invalid argument. Correct Usage: `" + 
					CONFIG.servers[message.guild.id].commandPrefix + command + " " + setting + " set <roleId>`";
					break;
			}
			break;
		case "minorRole":
			switch (tokens[1]) {
				case "set":
					let id = await message.guild.roles.fetch(tokens[2]);
					if (id === null) {
						msg += "That role doesn't exist.";
					} else {
						result = await updateConfig(message.guild.id, setting, tokens[2]);
					}
				  break;
				case "help":
					msg += setting + ": " + CONFIG.servers[message.guild.id][setting] +
					"\r\nInfo: Sets the role that the bot will give to users when they are suspected of being underage. Accepts a role Id.";
				  break;
				default:
				  msg += "Invalid argument. Correct Usage: `" + 
					CONFIG.servers[message.guild.id].commandPrefix + command + " " + setting + " set <roleId>`";
					break;
			}
			break;
		case "verifiedRole":
			switch (tokens[1]) {
				case "set":
					let id = await message.guild.roles.fetch(tokens[2]);
					if (id === null) {
						msg += "That role doesn't exist.";
					} else {
						result = await updateConfig(message.guild.id, setting, tokens[2]);
					}
				  break;
				case "help":
					msg += setting + ": " + CONFIG.servers[message.guild.id][setting] +
					"\r\nInfo: Sets the role that the bot will give to users when they are age verified. Accepts a role Id.";
				  break;
				default:
				  msg += "Invalid argument. Correct Usage: `" + 
					CONFIG.servers[message.guild.id].commandPrefix + command + " " + setting + " set <roleId>`";
					break;
			}
			break;
		case "tankChannel":
			switch (tokens[1]) {
				case "set":
					let id = await message.guild.channels.resolve(tokens[2]);
					if (id === null) {
						msg += "That channel doesn't exist.";
					} else {
						result = await updateConfig(message.guild.id, setting, tokens[2]);
					}
				  break;
				case "help":
					msg += setting + ": " + CONFIG.servers[message.guild.id][setting] +
					"\r\nInfo: Sets the channel where tanked users will see messages. Accepts a channel Id.";
				  break;
				default:
				  msg += "Invalid argument. Correct Usage: `" + 
					CONFIG.servers[message.guild.id].commandPrefix + command + " " + setting + " set <channelId>`";
					break;
			}
			break;
		case "minorChannel":
			switch (tokens[1]) {
				case "set":
					let id = await message.guild.channels.resolve(tokens[2]);
					if (id === null) {
						msg += "That channel doesn't exist.";
					} else {
						result = await updateConfig(message.guild.id, setting, tokens[2]);
					}
				  break;
				case "help":
					msg += setting + ": " + CONFIG.servers[message.guild.id][setting] +
					"\r\nInfo: Sets the channel where suspected minors will see messages. Accepts a channel Id.";
				  break;
				default:
				  msg += "Invalid argument. Correct Usage: `" + 
					CONFIG.servers[message.guild.id].commandPrefix + command + " " + setting + " set <channelId>`";
					break;
			}
			break;
		case "logChannel":
			switch (tokens[1]) {
				case "set":
					let id = await message.guild.channels.resolve(tokens[2]);
					if (id === null) {
						msg += "That channel doesn't exist.";
					} else {
						result = await updateConfig(message.guild.id, setting, tokens[2]);
					}
				  break;
				case "help":
					msg += setting + ": " + CONFIG.servers[message.guild.id][setting] +
					"\r\nInfo: Sets the channel where tank actions will be logged. Accepts a channel Id.";
				  break;
				default:
				  msg += "Invalid argument. Correct Usage: `" + 
					CONFIG.servers[message.guild.id].commandPrefix + command + " " + setting + " set <channelId>`";
					break;
			}
			break;
		case "invitesChannel":
			switch (tokens[1]) {
				case "set":
					let id = await message.guild.channels.resolve(tokens[2]);
					if (id === null) {
						msg += "That channel doesn't exist.";
					} else {
						result = await updateConfig(message.guild.id, setting, tokens[2]);
					}
				  break;
				case "help":
					msg += setting + ": " + CONFIG.servers[message.guild.id][setting] +
					"\r\nInfo: Sets the channel where invites, joins, and, leaves will be logged. Accepts a channel Id.";
				  break;
				default:
				  msg += "Invalid argument. Correct Usage: `" + 
					CONFIG.servers[message.guild.id].commandPrefix + command + " " + setting + " set <channelId>`";
					break;
			}
			break;
		case "mentionsLog":
			switch (tokens[1]) {
				case "set":
					let id = await message.guild.channels.resolve(tokens[2]);
					if (id === null) {
						msg += "That channel doesn't exist.";
					} else {
						result = await updateConfig(message.guild.id, setting, tokens[2]);
					}
				  break;
				case "help":
					msg += setting + ": " + CONFIG.servers[message.guild.id][setting] +
					"\r\nInfo: If a message containing a mention is edited to remove a mention, it gets logged to this channel. Accepts a channel Id.";
				  break;
				default:
				  msg += "Invalid argument. Correct Usage: `" + 
					CONFIG.servers[message.guild.id].commandPrefix + command + " " + setting + " set <channelId>`";
					break;
			}
			break;
		case "namesChannel":
			switch (tokens[1]) {
				case "set":
					let id = await message.guild.channels.resolve(tokens[2]);
					if (id === null) {
						msg += "That channel doesn't exist.";
					} else {
						result = await updateConfig(message.guild.id, setting, tokens[2]);
					}
				  break;
				case "help":
					msg += setting + ": " + CONFIG.servers[message.guild.id][setting] +
					"\r\nInfo: Sets the channel where user name changes will be logged. Accepts a channel Id.";
				  break;
				default:
				  msg += "Invalid argument. Correct Usage: `" + 
					CONFIG.servers[message.guild.id].commandPrefix + command + " " + setting + " set <channelId>`";
					break;
			}
			break;
		case "modlogChannel":
			switch (tokens[1]) {
				case "set":
					let id = await message.guild.channels.resolve(tokens[2]);
					if (id === null) {
						msg += "That channel doesn't exist.";
					} else {
						result = await updateConfig(message.guild.id, setting, tokens[2]);
					}
				  break;
				case "help":
					msg += setting + ": " + CONFIG.servers[message.guild.id][setting] +
					"\r\nInfo: Sets the channel where mod-level logs will be sent. Accepts a channel Id. Set this to a channel that is not accessible by botUserRole.";
				  break;
				default:
				  msg += "Invalid argument. Correct Usage: `" + 
					CONFIG.servers[message.guild.id].commandPrefix + command + " " + setting + " set <channelId>`";
					break;
			}
			break;
		case "bypassGMU":
			switch (tokens[1]) {
				case "add":
					let rid = await message.guild.roles.fetch(tokens[2]);
					let uid = await message.guild.members.fetch(tokens[2]).catch((e)=>{return null;});
					if ((rid === null) && (uid === null)) {
						msg += "That role/user doesn't exist.";
					} else {
						let val = CONFIG.servers[message.guild.id][setting];
						if (val === null) {
							val = [];
						}
						if (!val.includes(tokens[2].toString())) {
							val.push(tokens[2].toString());
							result = await updateConfig(message.guild.id, setting, val);
						} else {
							msg += "That role/user is already added.";
						}
					}
				  break;
				case "remove":
					let val = CONFIG.servers[message.guild.id][setting];
					if (val === null) {
						val = [];
					}
					if (val.includes(tokens[2].toString())) {
						val.splice(val.indexOf(tokens[2].toString(),1));
						result = await updateConfig(message.guild.id, setting, val);
					} else {
						msg += "That role/user isn't in the list.";
					}
				  break;
				case "help":
					msg += setting + ": " + (CONFIG.servers[message.guild.id][setting] !== null ? CONFIG.servers[message.guild.id][setting].join(", ") : "***NOT SET***") +
					"\r\nInfo: Add/Remove a role or user to a group that will be ignored by this bot. Accepts a role or user Id. This setting is preconfigured to include this bot.";
				  break;
				default:
				  msg += "Invalid argument. Correct Usage: `" + 
					CONFIG.servers[message.guild.id].commandPrefix + command + " " + setting + " add|remove <roleId | userId>`";
					break;
			}
			break;
		case "rolesToIgnore":
			switch (tokens[1]) {
				case "add":
					let id = await message.guild.roles.fetch(tokens[2]);
					if (id === null) {
						msg += "That role doesn't exist.";
					} else {
						let val = CONFIG.servers[message.guild.id][setting];
						if (val === null) {
							val = [];
						} 
						if (!val.includes(tokens[2].toString())) {
							val.push(tokens[2].toString());
							result = await updateConfig(message.guild.id, setting, val);
						} else {
							msg += "That role is already added.";
						}
					}
					break;
				case "remove":
					let val = CONFIG.servers[message.guild.id][setting];
					if (val === null) {
						val = [];
					}
					if (val.includes(tokens[2].toString())) {
						val.splice(val.indexOf(tokens[2].toString(),1));
						result = await updateConfig(message.guild.id, setting, val);
					} else {
						msg += "That role isn't in the list.";
					}
					break;
				case "help":
					msg += setting + ": " + (CONFIG.servers[message.guild.id][setting] !== null ? CONFIG.servers[message.guild.id][setting].join(", ") : "***NOT SET***") +
					"\r\nInfo: Add/Remove roles that the bot will not grant or remove from a user. Accepts a role Id.";
				  break;
				default:
				  msg += "Invalid argument. Correct Usage: `" + 
					CONFIG.servers[message.guild.id].commandPrefix + command + " " + setting + " add|remove <roleId>`";
					break;
			}
			break;
		case "rolesICannotTank":
			switch (tokens[1]) {
				case "add":
					let id = await message.guild.roles.fetch(tokens[2]);
					if (id === null) {
						msg += "That role doesn't exist.";
					} else {
						let val = CONFIG.servers[message.guild.id][setting];
						if (val === null) {
							val = [];
						}
						if (!val.includes(tokens[2].toString())) {
							val.push(tokens[2].toString());
							result = await updateConfig(message.guild.id, setting, val);
						} else {
							msg += "That role is already added.";
						}
					}
					break;
				case "remove":
					let val = CONFIG.servers[message.guild.id][setting];
					if (val === null) {
						val = [];
					}
					if (val.includes(tokens[2].toString())) {
						val.splice(val.indexOf(tokens[2].toString(),1));
						result = await updateConfig(message.guild.id, setting, val);
					} else {
						msg += "That role isn't in the list.";
					}
					break;
				case "help":
					msg += setting + ": " + (CONFIG.servers[message.guild.id][setting] !== null ? CONFIG.servers[message.guild.id][setting].join(", ") : "***NOT SET***") +
					"\r\nInfo: Add/Remove a role that the bot will be unable to tank. Accepts a role Id. Bot Users, Mod Users, Bot Masters, and anyone with Administrator permissions are normally untankable, please don't add them (This is already checked).";
				  break;
				default:
				  msg += "Invalid argument. Correct Usage: `" + 
					CONFIG.servers[message.guild.id].commandPrefix + command + " " + setting + " add|remove <roleId>`";
					break;
			}
			break;
		case "tankUOM":
			switch (tokens[1]) {
				case "set":
					if (!(
					  (tokens[2] === "minutes") ||
						(tokens[2] === "hours") ||
						(tokens[2] === "days")
					)){
						msg += "Unit Of Measure must be minutes, hours, or days. Be sure to check your spelling.";
					} else {
						if (tokens[2] === CONFIG.servers[message.guild.id][setting]) {
							msg += "tankUOM is already set to " + tokens[2] + ".";
						} else {
							result = await updateConfig(message.guild.id, setting, tokens[2]);
						}
					}
				  break;
				case "help":
					msg += setting + ": " + CONFIG.servers[message.guild.id][setting] +
					"\r\nInfo: Sets the default Unit Of Measure (UOM) when tanking a user without a specified time. Accepts minutes, hours, or days (not abbreviated).";
				  break;
				default:
				  msg += "Invalid argument. Correct Usage: `" + 
					CONFIG.servers[message.guild.id].commandPrefix + command + " " + setting + " set <minutes|hours|days>`";
					break;
			}
			break;
		case "tankDuration":
			switch (tokens[1]) {
				case "set":
				  if (isNaN(parseInt(tokens[2],10))) {
						msg += "Duration needs to be a positive integer.";
					} else {
						if (parseInt(tokens[2],10) < 1){
							msg += "Duration cannot be less than 1.";
						} else {
							if (parseInt(tokens[2],10) == CONFIG.servers[message.guild.id][setting]) {
								msg += "Duration is already set to " + tokens[2] + ".";
							} else {
								result = await updateConfig(message.guild.id, setting, parseInt(tokens[2],10));
							}
						}
					}
				  break;
				case "help":
					msg += setting + ": " + CONFIG.servers[message.guild.id][setting] +
					"\r\nInfo: Sets the default Duration when tanking a user without a specified time. Accepts a number (decimals will be dropped, not rounded)";
				  break;
				default:
				  msg += "Invalid argument. Correct Usage: `" + 
					CONFIG.servers[message.guild.id].commandPrefix + command + " " + setting + " set <value>`";
					break;
			}
			break;
		case "verifyAgeBy":
			switch (tokens[1]) {
				case "set":
				  if (isNaN(parseInt(tokens[2],10))) {
						msg += "Duration needs to be a positive integer.";
					} else {
						if (parseInt(tokens[2],10) < 1){
							msg += "Duration cannot be less than 1.";
						} else {
							if (parseInt(tokens[2],10) == CONFIG.servers[message.guild.id][setting]) {
								msg += "Duration is already set to " + tokens[2] + ".";
							} else {
								result = await updateConfig(message.guild.id, setting, parseInt(tokens[2],10));
							}
						}
					}
				  break;
				case "help":
					msg += setting + ": " + CONFIG.servers[message.guild.id][setting] +
					"\r\nInfo: How long (in hours) a suspected minor has before they are marked for banning. Accepts a number (decimals will be dropped, not rounded)";
				  break;
				default:
				  msg += "Invalid argument. Correct Usage: `" + 
					CONFIG.servers[message.guild.id].commandPrefix + command + " " + setting + " set <value>`";
					break;
			}
			break;
		case "writeMessageToDrunkTank":
			switch (tokens[1]) {
				case "set":
					if (isNaN(parseInt(tokens[2],10))) {
						msg += "Value needs to be numerical, preferably 0 or 1.";
					} else {
						if (!!parseInt(tokens[2],10) === CONFIG.servers[message.guild.id][setting]) {
							msg += "It's already set to " + !!parseInt(tokens[2],10) + ".";
						} else {
							result = await updateConfig(message.guild.id, setting, !!parseInt(tokens[2],10));
						}
					}
				  break;
				case "help":
					msg += setting + ": " + Number(CONFIG.servers[message.guild.id][setting]) +
					"\r\nInfo: If set to 1, will write an additional message in the drunktank when a user gets tanked. Accepts a numerical input, preferably 0 or 1 (will be converted anyway).";
				  break;
				default:
				  msg += "Invalid argument. Correct Usage: `" + 
					CONFIG.servers[message.guild.id].commandPrefix + command + " " + setting + " set <value>`";
					break;
			}
			break;
		case "warnAuthorizedUsage":
			switch (tokens[1]) {
				case "set":
					if (isNaN(parseInt(tokens[2],10))) {
						msg += "Value needs to be numerical, preferably 0 or 1.";
					} else {
						if (!!parseInt(tokens[2],10) === CONFIG.servers[message.guild.id][setting]) {
							msg += "It's already set to " + !!parseInt(tokens[2],10) + ".";
						} else {
							result = await updateConfig(message.guild.id, setting, !!parseInt(tokens[2],10));
						}
					}
				  break;
				case "help":
					msg += setting + ": " + Number(CONFIG.servers[message.guild.id][setting]) +
					"\r\nInfo: If set to 1, will respond to an unauthorized user with an insult, and refuse to oblige the user's command attempt. Accepts a numerical input, preferably 0 or 1 (will be converted anyway). *Logged actions are currently only done in the hosted bot's console in order to keep logs from getting overfilled.*";
				  break;
				default:
				  msg += "Invalid argument. Correct Usage: `" + 
					CONFIG.servers[message.guild.id].commandPrefix + command + " " + setting + " set <value>`";
					break;
			}
			break;
		case "help":
		  // array helpers
			let arrs = {
				bypassGMU: CONFIG.servers[message.guild.id].bypassGMU,
				rolesToIgnore: CONFIG.servers[message.guild.id].rolesToIgnore,
				rolesICannotTank: CONFIG.servers[message.guild.id].rolesICannotTank
			};
			
			Object.entries(arrs).forEach((i,o) => {
				if (o === null) {
					arrs[i] = "null";
				}
				if (Array.isArray(o)) {
					arrs[i] = o.join(", ");
				}
			});
		  msg += "Current Settings:" +
			"\r\n```" +
			'\r\ncommandPrefix: ' + CONFIG.servers[message.guild.id].commandPrefix +
			'\r\nbotMasterRole: ' + CONFIG.servers[message.guild.id].botMasterRole +
			'\r\nmodUserRole: ' + CONFIG.servers[message.guild.id].modUserRole +
			'\r\nbotUserRole: ' + CONFIG.servers[message.guild.id].botUserRole +
			'\r\nuncountedLimitRole: ' + CONFIG.servers[message.guild.id].uncountedLimitRole +
			'\r\ndrunktankRole: ' + CONFIG.servers[message.guild.id].drunktankRole +
			'\r\nminorRole: ' + CONFIG.servers[message.guild.id].minorRole +
			'\r\nverifiedRole: ' + CONFIG.servers[message.guild.id].verifiedRole +
			'\r\ntankChannel: ' + CONFIG.servers[message.guild.id].tankChannel +
			'\r\nminorChannel: ' + CONFIG.servers[message.guild.id].minorChannel +
			'\r\nlogChannel: ' + CONFIG.servers[message.guild.id].logChannel +
			'\r\ninvitesChannel: ' + CONFIG.servers[message.guild.id].invitesChannel +
			'\r\nmentionsLog: ' + CONFIG.servers[message.guild.id].mentionsLog +
			'\r\nnamesChannel: ' + CONFIG.servers[message.guild.id].namesChannel +
			'\r\nmodlogChannel: ' + CONFIG.servers[message.guild.id].modlogChannel +
			'\r\nbypassGMU: ' + arrs.bypassGMU +
			'\r\nrolesToIgnore: ' + arrs.rolesToIgnore +
			'\r\nrolesICannotTank: ' + arrs.rolesICannotTank +
			'\r\ntankUOM: ' + CONFIG.servers[message.guild.id].tankUOM +
			'\r\ntankDuration: ' + CONFIG.servers[message.guild.id].tankDuration +
			'\r\nwriteMessageToDrunkTank: ' + CONFIG.servers[message.guild.id].writeMessageToDrunkTank +
			'\r\nwarnAuthorizedUsage: ' + CONFIG.servers[message.guild.id].warnAuthorizedUsage +
			"\r\n```" +
			'\r\n' + (CONFIG.servers[message.guild.id].startServer ? "*SERVER IS RUNNING*" : "**SERVER IS __NOT__ RUNNING**") +
			"\r\nConfigurable Options:" +
			"\r\n```" +
			"\r\ncommandPrefix, botMasterRole, modUserRole, botUserRole, uncountedLimitRole, drunktankRole, minorRole, tankChannel, minorChannel, logChannel, invitesChannel, mentionsLog, namesChannel, modlogChannel, bypassGMU, rolesToIgnore, rolesICannotTank, tankUOM, tankDuration, writeMessageToDrunkTank, warnAuthorizedUsage, startServer" +
			"\r\n```" +
			"\r\nOther options:" +
			"\r\n```" +
			"\r\nhelp, getinvites, forceReload" +
			"\r\n```" +
			"\r\nBot Version: " + HELPERS.helpers.BOT_VERSION() + " - written by stevie_pricks#1903 & Sindrah#9620";
			break;
		case "forceReload":
		  let x = JSON.stringify(CONFIG.servers[message.guild.id]);
			let y = await reloadConfig(message.guild.id);
			let z = JSON.stringify(CONFIG.servers[message.guild.id]);
			if ((x === z) && (y)) {
				msg += "Configuration successfully reloaded. No changes.";
			} else if ((x !== z) && (y)) {
				msg += "Configuration successfully reloaded with new settings.";
			} else {
				msg += "Configuration failed to reload.";
			}
		  break;
		case "getinvites":
			let invs = await SERVICES.inviteService.storeInvites(message.guild);
			if (!invs.err) {
				msg += invs.saved + " Invite" + (invs.saved === 1 ? " has " : "s have ") + "been stored in the database.";
			} else {
				msg += "An error was encountered during the storage of invites. " + invs.saved + " were saved and " + invs.lost + " were not saved.";
			}
			break;
		default:
		  setting = (setting === "" ? " " : setting);
			msg += "`" + setting + "` is not valid. Try using `help` to see what commands this configurator can work with.";
			break;
	}
	if (result > 0) {
		let act = "";
		if (tokens[1] === "set") {act = "set";}
		if (tokens[1] === "add") {act = "added";}
		if (tokens[1] === "remove") {act = "removed";}
		msg += setting + " successfully " + act + " `" + tokens[2] + "`.";
	} else if (result === 0){
		msg += setting + " failed to " + tokens[1] + " `" + tokens[2] + "`.";
	}
	return message.channel.send(msg);
}

async function updateConfig(guild, setting, value) {
	cVal = {
		botMasterRole: "string",
		modUserRole: "string",
		botUserRole: "string",
		uncountedLimitRole: "string",
		drunktankRole: "string",
		minorRole: "string",
		verifiedRole: "string",
		tankChannel: "string",
		minorChannel: "string",
		logChannel: "string",
		invitesChannel: "string",
		mentionsLog: "string",
		namesChannel: "string",
		modlogChannel: "string",
		bypassGMU: "array",
		rolesToIgnore: "array",
		rolesICannotTank: "array",
		tankUOM: "string",
		tankDuration: "integer",
		verifyAgeBy: "integer",
		writeMessageToDrunkTank: "boolean",
		warnAuthorizedUsage: "boolean"
	};
	
	//convert the value to the intended type for the DB
	switch(cVal[setting]) {
		case "integer":
			value = parseInt(value,10);
			break;
		case "string":
		  value = value.toString();
			break;
		case "array":
			value = value.length < 1 ? null : value.join(",");
		  break;
		case "boolean":
			value = !!value;
			break;
	}
	
	query = {
		update: 'config',
		sets: setting + " = ?",
		where: "serverID = ?", // DB alteration ID => Id
		values: [value, guild]
	};
	
	await MANAGERS.dbConnectionManager.Query(query);
	
	await reloadConfig(guild);
	
	// convert the value back for comparing
	switch(cVal[setting]) {
		case "integer":
			value = parseInt(value,10);
			break;
		case "string":
		  value = value.toString();
			break;
		case "array":
			value = value === null ? null : value.split(",");
		  break;
		case "boolean":
			value = !!value;
			break;
	}
	if (
	  (CONFIG.servers[guild][setting] === value) ||
	  (
			(JSON.stringify(CONFIG.servers[guild][setting]) === JSON.stringify(value)) &&
		  (typeof CONFIG.servers[guild][setting] === (typeof value))
		)
	) {
		return 1;
	} else {
		return 0;
	}
}

async function reloadConfig(g) {
	var rec = await MANAGERS.dbConnectionManager.Query({"select": "config", "columns":["*"], "where": "serverID = ?", "orderby": "serverID", "values":[g]}); // DB alteration ID => Id
	if (rec.length) {
		rec.forEach((e) => {
			CONFIG.servers[e.serverID.toString()] = e; // DB alteration ID => Id
		});
		rec = {};
		rec[g] = CONFIG.servers[g];
		rec = HELPERS.helpers.convertDataFromDB(rec,"cfg");
		CONFIG.servers[g] = rec[g];
		return true;
	}
	return false;
}

async function handle(m) {
	var refreshedAuthorObj = await SERVICES.guildService.getMemberForceLoad(m.author.id);
	if (!(
		refreshedAuthorObj._roles.includes(CONFIG.servers[m.guild.id].botMasterRole) ||
		m.member.permissions.has(1 << 3)
	)) {
		HELPERS.logger.log("UNAUTHORIZED USAGE ATTEMPT: <@" + m.author.id + "> (" + m.author.tag + ") (" + m.author.id + ") Tried to use me with this command: " + m.content);
		if (CONFIG.servers[m.guild.id].warnAuthorizedUsage)
			m.channel.send("You don't have the rights to use me you filthy swine!");
		return;
	}
	
	return resolveCommand(m);
}

exports.handle = handle;
exports.configure = configure;
exports.help = help;