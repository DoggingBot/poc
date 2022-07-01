function help(prefix) {
    return prefix + "tankstats - gets info of specific user or top 5 if not provided.\r\n";
}

async function handle(message) {
	var user = HELPERS.helpers.trimMsg(message);
	var tokens = HELPERS.helpers.tokenize(user.substr(1,user.length -1 ));
	
	//check token length
	if (tokens.length < 2) {
		user = false;
	} else {
		// A user handle or ID was passed with the command, we are looking for just this data
		user = SERVICES.guildService.getMemberFromCache(message.mentions.users.first().id); // Mention Handle
		if (!user) {
		  user = SERVICES.guildService.getMemberFromCache(tokens[1]); // Using ID
		}
	}
	
	var json = await SERVICES.tankStatsService.filterTankStats(message.guild.id, user);
	var msg = await SERVICES.tankStatsService.getTankStatsStr(json, user);
	
	message.channel.send(msg);
}

exports.handle = handle;
exports.help = help;