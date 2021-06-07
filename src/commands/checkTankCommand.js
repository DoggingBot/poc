
var persistenceService = require('../services/persistenceService');

const HELPERS = require('../helpers/helpers');

var CONFIG;
function injectConfig(_cfg) {
    CONFIG = _cfg;
}

async function handle(message) {
    let ts = Date.now();
    var json = persistenceService.getTankedUsers();
    var concat = "";
    var toSend = [];
    for (n=0;n<json.length; n++) {
        var obj = json[n];
        if (obj.archive) {
            continue;   
        }
        var datediff = HELPERS.getDateDiffString(ts, obj.time_tanked);
        if (obj.tanked_by == "Unknown") {
            msg = HELPERS.getAtString(obj.user_tanked) + " was not tanked by me. I learned about them " + datediff + " ago."; 
        }
        else {
            msg = "(tanked " + datediff + " ago by " + obj.tanked_by 
                + (obj.reason == "") ? " for " + obj.reason + ")" : ")";
            if (ts > obj.time_to_untank) {
                msg = HELPERS.getAtString(obj.user_tanked) + " has served their time. " + msg; 
            }
            else {
                msg = HELPERS.getAtString(obj.user_tanked) + " still has time to wait. " + msg
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
exports.injectConfig = injectConfig;