
var persistenceService = require('../services/persistenceService');
var guildService = require('../services/guildService');
const HELPERS = require('../helpers/helpers');

var CONFIG;
function injectConfig(_cfg) {
    CONFIG = _cfg;
}

async function handle(message) {
    var allSips = persistenceService.getAllSips();

    var msg = "";
    for (i = 0; i < CONFIG.countedStrings.length; i++) {
         sipStr = CONFIG.countedStrings[i];
         var filteredArray = allSips.filter(x=> x.sipStr == sipStr);
         var sortedArray = filteredArray.sort((a,b) => { return  b.count - a.count }).slice(0,5);

         msg += "== " + sipStr + " Top 5 =="
         for (n = 0; n <sortedArray.length; n++) {
             x = sortedArray[n];
             var str;
             try { 
                str = await guildService.getMemberFromCache(x.userID);
                str = str.nickname;
             } 
             catch {
                 str = HELPERS.getAtString(x.userID);
             }
             msg += "\r\n" + str + " - " + x.count;
             if (x.count % 69 == 0 || x.count % 420 == 0) {
                 msg += ". Nice.";
             }
         }
         msg += "\r\n";
         message.channel.send(msg);
         msg = "";
    }

        
   
}

exports.handle = handle;
exports.injectConfig = injectConfig;