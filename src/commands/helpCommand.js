
const HELPERS = require('../helpers/helpers');

var CONFIG;
function injectConfig(_cfg) {
    CONFIG = _cfg;
}

async function handle(message) {
    var help = "==help==" +
        "\r\n" + CONFIG.commandPrefix +"tank - drunk tanks a user. usage: "+CONFIG.commandPrefix+"tank @user reason." +
        "\r\n" + CONFIG.commandPrefix +"checktank - Checks the current users in the tank." +
        "\r\n" + CONFIG.commandPrefix +"untank - Untank a user. usage: "+CONFIG.commandPrefix+"untank @user reason." +
        "\r\n" + CONFIG.commandPrefix +"tankstats - Stats for fun. " +
        "\r\n" + CONFIG.commandPrefix +"synctank - sync up the 2drunk2party role with the Bot tank log. " +        
        "\r\n" + CONFIG.commandPrefix +"help - Sends this help message" +
        "\r\n" +
        "\r\n" + CONFIG.bot_name + " " + HELPERS.BOT_VERSION + " by stevie_pricks & Sindrah";


    message.channel.send(help);
}

exports.handle = handle;
exports.injectConfig = injectConfig;