
const HELPERS = require('../helpers/helpers');

/* DEPRECATED AND REMOVED; CONFIG lives in global namespace of main.js
var CONFIG;
function injectConfig(_cfg) {
    CONFIG = _cfg;
}
*/

async function handle(message) {
	  var prefix = CONFIG.servers[message.guild.id].commandPrefix;
    var help = "==TankCommander Help==" +
        "\r\n" + prefix + "tank - drunk tanks a user. usage: `" + prefix + "tank @user reason`" +
        "\r\n" + prefix + "checktank - Checks the current users in the tank." +
        "\r\n" + prefix + "untank - Untank a user. usage: `" + prefix + "untank @user [reason]`" +
        "\r\n" + prefix + "tankstats - gets info of specific user or top 5 if not provided." +
				"\r\n" + prefix + "config - configures various settings. Use `" + prefix + "config help` for more info." +
        //"\r\n" + prefix +"synctank - sync up the 2drunk2party role with the Bot tank log. " + DEPRECATED AND REMOVED; uses DB now instead of DRP    
        "\r\n" + prefix +"help - Sends this help message" +
        "\r\n" +
        "\r\n" + CONFIG.bot_name + " " + HELPERS.BOT_VERSION() + " by stevie_pricks & Sindrah";


    message.channel.send(help);
}

exports.handle = handle;
//exports.injectConfig = injectConfig;