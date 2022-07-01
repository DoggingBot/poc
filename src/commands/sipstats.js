
function help() {
    return "";
}

async function handle(message) {
	var allSips = await SERVICES.persistenceService.getAllSips(message.guild.id);
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
				u = SERVICES.guildService.getMemberFromCache(u);
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
exports.help = help