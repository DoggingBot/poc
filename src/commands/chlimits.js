function help(prefix) {
  return prefix + "chlimits - manage limited channel limits. usage: `" + prefix + "chlimits <channelId> <limit>`\r\n" +
    "  omit arguments to get the list of all channel limits\r\n" +
    "  limit must be between 1 and 99, or 0 to remove it";
}

async function handle(message) {
  // Restrict command from users that cannot modify channels
	if (!message.member.permissions.has(1 << 4)) {
		if (CONFIG.servers[message.guild.id].warnAuthorizedUsage) {
			message.channel.send("You don't have the ability to manage a channel.");
		}
		return false;
	}

	let msg = message.content.split(" ");

	if (msg[1] === "help") {
		return message.channel.send(help(CONFIG.servers[message.guild.id].commandPrefix));
	}

    if (msg.length === 1) {
    // List all channel limits that are set
    let limits = await getLimits(message.guild.id);
    let out = "Saved Channel Limits\r\n--------------------";
    Object.entries(limits).forEach(([ch,lim]) =>{
      out += "\r\n<#" + ch + "> - " + lim;
    });
	return message.channel.send(out);
  }
  if (msg.length === 2) {
    // Invalid Arguments
		return message.channel.send("Invalid Arguments. You need to supply a valid Channel ID and a number between 1 and 99 as a limit.");
  }
  if (msg.length >= 3) {
    // Validate proper args and ignore the rest
		let ch = message.guild.channels.cache.get(msg[1]);
		if ((ch === undefined) || (ch === null)) {
			return message.channel.send(msg[1] + " is not a valid channel ID.");
		}
		ch = msg[1];
		let lim = parseInt(msg[2]);
		if (isNaN(lim) || msg[2] < 0 || msg[2] > 99) {
			return message.channel.send(msg[2] + " is not a valid limit.");
		}
		
		let result = await setLimit(message.guild.id, ch, lim).catch((e)=>{return "Failed to save channel limit - ChannelId: " + ch + " , Limit: " + lim;});
		return message.channel.send(result);
  }
}

async function getLimits(guildId, channelId) {
	// Does table exist?
	let query = {
		select: guildId + "_channelLimits",
		columns: ["*"],
		where: "?",
		values: [1]
	};
	
	let tbl = await MANAGERS.dbConnectionManager.Query(query).catch((e)=>{return null});
	if (tbl === null) {
		// Create the table, then return empty as there is nothing yet.
		query = {
			create: guildID + "_channelLimits",
			columns: [
				"`channelID` VARCHAR(20) NOT NULL PRIMARY KEY", // DB alteration ID => Id
				"`limit` TINYINT(2) UNSIGNED NOT NULL"
			]
		}
		await MANAGERS.dbConnectionManager.Query(query);
		return {"No channel limits have been set": "add a channel first"};
	}
	
	query = {
		select: guildId + "_channelLimits",
		columns: ["*"],
		where: "?",
		values: [1]
	};
	
	if (arguments.length === 2) {
		query.where = "channelID = ?"; // DB alteration ID => Id
		query.values = [channelId];
	}
	
	let recs = await MANAGERS.dbConnectionManager.Query(query);
	if (recs.length === 0) {
		return {"No channel limits have been set": "add a channel first"};
	}
	let lims = {}; 
	recs.forEach((o,i)=>{
		lims[o.channelID] = parseInt(o.limit); // DB alteration ID => Id
	});
	return lims;
}

async function setLimit(guildId, channelId, limit) {
	// see if the channel exists, update/insert as needed. limit 0 on channelId that isn't set is invalid.
	var r = await getLimits(guildId, channelId);
	var query = {};
	var response = "";
	if (r["No channel limits have been set"]) {
		// Doesn't exist, insert it
		query = {
			insert: guildID + "_channelLimits",
			columns: ["`channelID`","`limit`"], // DB alteration ID => Id
			valueHolders: "(?,?)",
			values: [channelId, limit]
		};
		response = "Added channel Id " + channelId + " with limit " + limit;
	} else {
		// Update or delete
		if (limit === 0) {
			// Delete
			query = {
				del: guildID + "_channelLimits",
				where: "channelID = ?", // DB alteration ID => Id
				values: [channelId]
			}
			response = "Removed channel limit: " + channelId;
		} else {
			query = {
				update: guildID + "_channelLimits",
				sets: "limit = ?",
				where: "channelID = ?", // DB alteration ID => Id
				values: [limit, channelId]
			}
			response = "Updated channel Id " + channelId + " with limit " + limit;
		}
	}
	let testQuery = await MANAGERS.dbConnectionManager.Query(query);
	if (testQuery === null) {
		return "DB ERROR";
	}
	return response;
}

exports.handle = handle;
exports.help = help;
exports.getLimits = getLimits;