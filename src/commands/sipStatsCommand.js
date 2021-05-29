
var persistenceService = require('../services/persistenceService');
var guildService = require('../services/guildService');
var CONFIG;
function injectConfig(_cfg) {
    CONFIG = _cfg;
}

async function handle(message) {
    var allSips = persistenceService.getAllSips();

    var msg = "";
    CONFIG.countedStrings.forEach((sipStr) => {
        var filteredArray = allSips.filter(x=> x.sipStr == sipStr);
        var sortedArray = filteredArray.sort((a,b) => { return  b.count - a.count }).slice(0,5);;

        msg += "== " + sipStr + " Top 5 =="
        sortedArray.forEach((x)=> {
            userObj = guildService.getMemberForceLoad(x.userID);
            msg += "\r\n" + userObj.nickname + " - " + x.count;
        })
        msg += "\r\n";
    })

        
    message.channel.send(msg);
}

exports.handle = handle;
exports.injectConfig = injectConfig;