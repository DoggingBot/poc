
const HELPERS = require('../helpers/helpers');
var persistenceService = require('../services/persistenceService');
var CONFIG;
function injectConfig(_cfg) {
    CONFIG = _cfg;
}

async function handle(message) {
    var userObj = persistenceService.getAllSips();

    var msg = "";
    CONFIG.countedStrings.forEach((sipStr) => {
        var filteredArray = userObj.filter(x=> x.sipStr == sipStr);
        var sortedArray = filteredArray.sort((a,b) => { return  b.count - a.count }).slice(0,5);;

        msg += "== " + sipStr + " Top 5 =="
        sortedArray.forEach((x)=> {
            msg += "\r\n" + HELPERS.getAtString(x.userID) + " - " + x.count;
        })
        msg += "\r\n";
    })

        
    message.channel.send(msg);
}

exports.handle = handle;
exports.injectConfig = injectConfig;