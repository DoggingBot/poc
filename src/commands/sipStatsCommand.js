
const HELPERS 
var persistenceService = require('../services/persistenceService');
var CONFIG;
function injectConfig(_cfg) {
    CONFIG = _cfg;
}

async function handle(message) {
    var action = message.content;
    var userId = message.author.id;

    var userObj = persistenceService.getAllSips();


    CONFIG.countedStrings.forEach((sipStr) => {
        var filteredArray = userObj.filter(x=> x.sipStr == sipStr);
        var sortedArray = filteredArray.sort((a,b) => { return  b.count - a.count }).slice(0,5);;

        var msg = "== " + sipStr + " Top 5 =="
        sortedArray.forEach((x)=> {
            msg += "\R\N" + HELPERS.getAtString(x.userId) + " - " + x.count;
        })
        msg += "\R\N";
    })

        
    message.channel.send(msg);
}

exports.handle = handle;
exports.injectConfig = injectConfig;