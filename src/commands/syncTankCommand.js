
var syncTankService = require('../services/syncTankService');

var CONFIG;
function injectConfig(_cfg) {
    CONFIG = _cfg;
}

async function handle(message) {
    var results = await syncTankService.syncTank();
    message.channel.send("TankSync complete. " + results.tanked + " entries added to the tank log, " + results.untanked + " removed.");
}

exports.handle = handle;
exports.injectConfig = injectConfig;