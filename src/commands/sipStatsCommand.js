
var persistenceService = require('../services/persistenceService');
var guildService = require('../services/guildService');
const HELPERS = require('../helpers/helpers');

/* DEPRECATED; CONFIG lives in global namespace of main.js
var CONFIG;
function injectConfig(_cfg) {
    CONFIG = _cfg;
}
*/

async function handle(message) {
	var allSips = await persistenceService.getAllSips(message.guild.id);
	var msg = "";
	allSips.structure.forEach((c,k) => {
		if ((c != "userId") && (c != "lastSip")) {
			msg += msg === "" ? "" : "\r\n";
			msg += "== " + c + " Top 5 ==";
			allSips.data.sort((a,b) =>{
				return b[c] - a[c];
			});
			for (i=0;i<5;i++) {
				let u = allSips.data[i].userId;
				u = guildService.getMemberFromCache(u);
				let r = allSips.data[i][c];
				msg += "\r\n" + (i + 1) + ". " + u.displayName + " (" + u.user.tag + ") - " + r;
				if (allSips.data.length === i + 1) {
					break;
				}
			}
		}
	});
	message.channel.send(msg);
}

exports.handle = handle;
//exports.injectConfig = injectConfig;