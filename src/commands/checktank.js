function help(prefix) {
    return prefix + "checktank - Checks the current users in the tank.\r\n";
}

async function handle(message) {
    let ts = Date.now();
    var json = await SERVICES.persistenceService.getTankedUsers(message.guild.id,true);
	var minors = await SERVICES.persistenceService.getMinorUsers(message.guild.id);
    var concat = "";
    var toSend = [];
		
	// Due to a need to run an async wait command on every found tanked member and suspected minor,
	// we are going to iterate the old fashioned way with forLoop.
	// i = index = time_tanked/minorMemberId; o = tankRecord/minorRecord;
    var tankTimes = Object.keys(json);
	for (i = 0; i < tankTimes.length; i++) {
		let o = json[tankTimes[i]];
        var datediff = HELPERS.helpers.getDateDiffString(ts, parseInt(o.time_tanked, 10));
				var tanker = message.guild.members.cache.get(o.tanked_by);
				if (tanker == undefined) {
					tanker = await message.client.users.fetch(o.tanked_by);
					tanker = tanker.username + " (" + tanker.tag + ") (" + tanker.id + ")";
				} else {
					tanker = tanker.displayName + "(" + tanker.user.tag + ") (" + tanker.id + ")";
				}
				// Check if the tanked user is still in the server
				var inServer = message.guild.members.cache.get(o.user_tanked);
				var timeServed = ts > o.time_to_untank ? true : false;
				if (inServer === undefined) {
					// user is not in the server, find out if it was an uncaught ban
					var isBanned = await message.guild.bans.fetch(o.user_tanked).catch((e)=>{return false;});
					if (isBanned) {
						// ban exists and was not caught yet. Close out the tank record and move on to the next tank record.
						var user = await message.client.users.fetch(o.user_tanked);
						await SERVICES.drunkTankService.untankUser(message.guild.id, user, message.client.user, o, "Banned");
						continue;
					}
					inServer = "**(NOT IN SERVER)**";
				} else {
					inServer = "";
				}
        if (o.tanked_by == 0) {
          msg = "<@" + o.user_tanked + "> was not tanked by me. I learned about them " + datediff + " ago."; 
        } else {
					msg = "(tanked " + datediff + " ago by " + tanker 
						+ (o.tank_reason != "" ? " for " + o.tank_reason + ")" : ")");
					if (timeServed) {
						msg = "<@" + o.user_tanked + "> " + inServer + " **has served their time**. " + msg; 
					}
					else {
						msg = "<@" + o.user_tanked + "> " + inServer + " still has time to wait. " + msg;
					}
        }

        //beware of the max length for a message
        if ((concat + '\r\n' + msg).length >= 2000) {
            toSend.push(concat);
            concat = msg;
        }
        else {
            concat += '\r\n' + msg;
        }
    }
	if (concat != "") toSend.push(concat);

    if (toSend.length == 0) {
        message.channel.send("According to my records, the drunk tank is empty!");
    } else {
        toSend.forEach((obj) => {
            message.channel.send(obj);
        });
    }

	// Ready the Age Verification section
	var minorUsers = Object.keys(minors);
	let concat2 = "";
	let toSend2 = [];
	for (i = 0; i < minorUsers.length; i++) {
		let o = minors[minorUsers[i]];
        var datediff = HELPERS.helpers.getDateDiffString(ts, parseInt(o.time, 10));
		var staffMember = message.guild.members.cache.get(o.staff_user);
		if (staffMember == undefined) {
			staffMember = await message.client.users.fetch(o.staff_user);
			staffMember = staffMember.username + " (" + staffMember.tag + ") (" + staffMember.id + ")";
		} else {
			staffMember = staffMember.displayName + "(" + staffMember.user.tag + ") (" + staffMember.id + ")";
		}
		// Check if the suspected user is still in the server
		var inServer = message.guild.members.cache.get(o.user);
		var timesUp = ts > o.ban_by ? " **Ask a mod to** <:banhammer:772993003656577054> " : "";
		if (inServer === undefined) {
			// user is not in the server, find out if it was an uncaught ban
			var isBanned = await message.guild.bans.fetch(o.user).catch((e)=>{return false;});
			if (isBanned) {
				// ban exists and was not caught yet. Purge the record.
				await SERVICES.persistenceService.removeMinor(message.guild.id, o.user);
				continue;
			}
			inServer = "**(NOT IN SERVER)**";
		} else {
			inServer = "";
		}
        msg = "<@" + o.user + "> " + inServer + timesUp + " - initiated by " + staffMember + " " + datediff + " ago.";

        //beware of the max length for a message
        if ((concat2 + '\r\n' + msg).length >= 2000) {
            toSend2.push(concat2);
            concat2 = msg;
        }
        else {
            concat2 += '\r\n' + msg;
        }
    }
	if (concat2 != "") toSend2.push(concat2);

    if (toSend2.length != 0) {
		message.channel.send("Needs Age Verification\r\n----------------------");
        toSend2.forEach((obj) => {
            message.channel.send(obj);
        });
    }
}

exports.handle = handle;
exports.help = help;