
async function handle(message) {
    /* Old way. Now every command will have it's help listed in the file.

	var prefix = CONFIG.servers[message.guild.id].commandPrefix;
    var help = "==TankCommander Help==" +
        "\r\n" + prefix + "tank - drunk tanks a user. usage: `" + prefix + "tank @user reason`" +
        "\r\n" + prefix + "checktank - Checks the current users in the tank." +
        "\r\n" + prefix + "untank - Untank a user. usage: `" + prefix + "untank @user [reason]`" +
        "\r\n" + prefix + "tankstats - gets info of specific user or top 5 if not provided." +
				"\r\n" + prefix + "config - configures various settings. Use `" + prefix + "config help` for more info." +
        //"\r\n" + prefix +"synctank - sync up the 2drunk2party role with the Bot tank log. " + DEPRECATED; uses DB now instead of DRP    
        "\r\n" + prefix +"help - Sends this help message" +
        "\r\n" +
        "\r\n" + CONFIG.bot_name + " " + HELPERS.helpers.BOT_VERSION() + " by stevie_pricks & Sindrah";

    */
    var help = '==TankCommander Help==\r\n';
    Object.keys(COMMANDS).forEach((c) => {
        help += COMMANDS[c].help(CONFIG.servers[message.guild.id].commandPrefix);
    });
    help += "\r\n" + CONFIG.bot_name + " " + HELPERS.helpers.BOT_VERSION() + " by stevie_pricks & Sindrah";
    message.channel.send(help);
}
function help(prefix) {
    return prefix + "help - Sends this help message";
}

exports.handle = handle;
exports.help = help;