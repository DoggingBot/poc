const HELPERS = require('../helpers/helpers');
var tankStatsService = require('../services/tankStatsService');

/* DEPRECATED AND REMOVED; CONFIG lives in global namespace of main.js
var CONFIG;
function injectConfig(_cfg) {
    CONFIG = _cfg;
}
*/

async function handle(message) {
	var user = HELPERS.trimMsg(message);
	var tokens = HELPERS.tokenize(user.substr(1,user.length -1 ));
	
	//check token length
	if (tokens.length < 2) {
		user = false;
	} else {
		// A user handle or ID was passed with the command, we are looking for just this data
		user = guildService.getMemberFromCache(message.mentions.users.first().id); // Mention Handle
		if (!user) {
		  user = guildService.getMemberFromCache(tokens[1]); // Using ID
		}
	}
	
	var json = await tankStatsService.filterTankStats(message.guild.id, user);
	var msg = await tankStatsService.getTankStatsStr(json, user);
	
	message.channel.send(msg);
}

exports.handle = handle;
//exports.injectConfig = injectConfig;