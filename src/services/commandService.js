async function parseCommand(message,configured) {
	// Responds to .configure only when not yet configured. Once configured, .config is needed.
	if (configured) {
		var cfg = CONFIG.servers[message.guild.id];

        // Check for fake links in a message
        let fakelink = await SERVICES.fakeLinkChecker.handle(message);
        if (fakelink) {
            return false;
        }

		var countedStrings = await SERVICES.persistenceService.getAllSips(message.guild.id);
		countedStrings = countedStrings.structure; // set to only the columns
		countedStrings.splice(0,2); // remove the first column 'userId & lastSip'
        //Handle some events with auth
        var command;
        if ((countedStrings.includes(message.content.toLowerCase())) || (message.content.toLowerCase() === "mysips")) {
            COMMANDS["sip"].handle(message);
        }
        else if (message.content.toLowerCase() === (cfg.commandPrefix + "sipstats")) {
            COMMANDS["sipstats"].handle(message);
        }
        // Except as provided above, the bot will not respond to a command when the message doesn't start with the prefix
        if(!message.content.startsWith(cfg.commandPrefix)) return false;
        //Also try and catch mistakes. Especially watch p as its used by the music bots
        if (message.content.startsWith(cfg.commandPrefix + cfg.commandPrefix) ||
            message.content.startsWith(cfg.commandPrefix + "p") ||
            message.content.startsWith(cfg.commandPrefix + " ") ||
            message.content === (cfg.commandPrefix + "") // nothing at all, it's just the prefix.
        ) return false;
        authorId = message.author.id;
        var refreshedAuthorObj = await SERVICES.guildService.getMemberForceLoad(authorId);
        //Process our message
        var command = HELPERS.helpers.trimCommand(message);  
        //Verify the user has the right to use the bot
        let hasRightToUse = false;
        if (
            refreshedAuthorObj._roles.includes(cfg.botUserRole) ||
            refreshedAuthorObj._roles.includes(cfg.modUserRole) ||
            message.member.permissions.has(1 << 3) ||
            refreshedAuthorObj._roles.includes(cfg.botMasterRole)
        ) {
            hasRightToUse = true;
        }
        if (!hasRightToUse) {
            HELPERS.logger.log("UNAUTHORIZED USAGE ATTEMPT: <@" + authorId + "> (" + message.author.tag + ") (" + authorId + ") Tried to use me with this command: " + message.content);
            if (cfg.warnAuthorizedUsage) message.channel.send("You don't have the rights to use me you filthy swine!");
            return false;
        }
        switch (command) {
            case "help":
            case "tank":
            case "untank":
            case "checktank":
            case "tankstats":
            case "banlist":
            case "config":
            case "minor":
            case "adult":
            case "chlimits":
            //case "getleaves":
                // Valid commands
                break;
            default:
                command = "invalid";
                if (cfg.warnAuthorizedUsage) {
                return message.channel.send("I don't know that command. Want me to build it? Do it yourself you lazy throbber");
                }
                return false;
        }
        if (COMMANDS[command] !== undefined) {
            return COMMANDS[command].handle(message);
        } else {
            return false;
        }
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
				return false; // Don't even acknowledge the message.
			}
			// call the default configure function
			return COMMANDS.config.configure(message, prefix);
		}
		return false; // Ignore the message, wasn't for the bot.
	}
}

exports.parseCommand = parseCommand;