var persistenceService = require('../services/persistenceService');

const HELPERS = require('../helpers/helpers');

/* DEPRECATED AND REMOVED; CONFIG lives in global namespace of main.js
var CONFIG;
function injectConfig(_cfg) {
    CONFIG = _cfg;
}
*/

async function handle(message) {
    let ts = Date.now();
    var json = await persistenceService.getTankedUsers(message.guild.id,true);
    var concat = "";
    var toSend = [];
		
		// Due to a need to run an async wait command on every found tanked member,
		// we are going to iterate the old fashioned way with forLoop.
		// i = index = time_tanked; o = tankRecord;
    var tankTimes = Object.keys(json);
		for (i = 0; i < tankTimes.length; i++) {
			let o = json[tankTimes[i]];
        var datediff = HELPERS.getDateDiffString(ts, parseInt(o.time_tanked, 10));
				var tanker = message.guild.members.cache.get(o.tanked_by);
				if (tanker == undefined) {
					tanker = await message.client.users.fetch(o.tanked_by);
					tanker = tanker.username + " (" + tanker.tag + ") (" + tanker.id + ")";
				} else {
					tanker = tanker.displayName + "(" + tanker.user.tag + ") (" + tanker.id + ")";
				}
        if (o.tanked_by == 0) {
            msg = "<@" + o.user_tanked + "> was not tanked by me. I learned about them " + datediff + " ago."; 
        }
        else {
            msg = "(tanked " + datediff + " ago by " + tanker 
                + (o.tank_reason != "" ? " for " + o.tank_reason + ")" : ")");
            if (ts > o.time_to_untank) {
                msg = "<@" + o.user_tanked + "> has served their time. " + msg; 
            }
            else {
                msg = "<@" + o.user_tanked + "> still has time to wait. " + msg;
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
    }
    else {
        toSend.forEach((obj) => {
            message.channel.send(obj);
        });
    }
}

exports.handle = handle;
//exports.injectConfig = injectConfig;