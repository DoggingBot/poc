function help(prefix) {
    return prefix + "banlist - Obtains ban details for the server or a specific user. Usage: `" + prefix + "banlist [userMention | UserID]`\r\n";
}

async function handle(message) {
	let bannedUser = false;
	if (message.mentions.users.size !== 0) {
		bannedUser = await message.guild.fetchBan(message.mentions.users.first().id).catch((e)=>{return "notBanned";});
	} else if (message.content.split(" ").length > 1) {
		bannedUser = (/^\d{1,20}$/).test(message.content.split(" ")[1]) ? await message.client.users.fetch(message.content.split(" ")[1]).catch((e)=>{return "invalid";}) : "invalid";
		if (bannedUser !== "invalid") {
			bannedUser = await message.guild.fetchBan(bannedUser.id).catch((e)=>{return "notBanned";});
		}
	}
	
	if (bannedUser === "invalid") {
		return message.channel.send("Invalid user supplied.");
	}
	if (bannedUser === "notBanned") {
		return message.channel.send("User is not banned");
	}
	if (bannedUser) {
		return message.channel.send(bannedUser.user.tag + " (" + bannedUser.user.id + ") Reason: " + bannedUser.reason);
	}
	
	// Wants all the bans. Fetch them all, and dump them into the banlist channel -- update to find channel by name, hardcoded for now
	let banlist = await message.guild.fetchBans()
	.catch((e)=>{
		return "Error: " + e;
	});
	
	var concat = "";
	var toSend = [];
	
	banlist.forEach((b)=>{
		let msg = b.user.tag + " (" + b.user.id + ") Reason: " + b.reason;
		//beware of the max length for a message
		if (concat == "") {
			concat = msg;
		} else {
			if ((concat + '\r\n' + msg).length >= 2000) {
				toSend.push(concat);
				concat = msg;
			}	else {
				concat += '\r\n' + msg;
			}
		}
	});
	if (concat != "") toSend.push(concat);

	// Clear all messages in banlist channel
	let banlist_channel = message.guild.channels.cache.get('936183699391778846');
	await banlist_channel.messages.fetch({limit: 100})
	.then(messages => {
		messages.forEach((msg)=>{
			banlist_channel.messages.resolve(msg).delete();
		});
	})
	.then(() => {
		// Send all bans to the banlist channel
		if (toSend.length == 0) {
				banlist_channel.send("There are no banned users in the server.");
		} else {
			toSend.forEach((obj) => {
				banlist_channel.send(obj);
			});
		}
	});	
	return true;
}

exports.handle = handle;
exports.help = help;