
var tankStatsServcice = require('../services/tankStatsService');

var CONFIG;
function injectConfig(_cfg) {
    CONFIG = _cfg;
}

async function handle(message) {
    var msg = await tankStatsServcice.getTankStatsStr();
    message.channel.send(msg);
}

exports.handle = handle;
exports.injectConfig = injectConfig;