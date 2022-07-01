function help(prefix) {
    return prefix + "minor - Suspect a user of being underage. usage: `" + prefix + "minor @user`\r\n";
}

async function handle(message) {
    msg = HELPERS.helpers.trimMsg(message);
	tokens = HELPERS.helpers.tokenize(msg.substr(1,msg.length -1 ));
		
    var minorUser = SERVICES.guildService.getMemberFromCache(message.mentions.users.first().id);
    var author = SERVICES.guildService.getMemberFromCache(message.author.id);
    var role = await SERVICES.guildService.getRole(CONFIG.servers[message.guild.id].minorRole);
		
    //Make sure we have a mention on the message
    if (!HELPERS.helpers.validateMentions(message, "minor")) {
        return;
    }

    //actually put the user in the minorChannel
    return await SERVICES.minorService.suspectUser(message.guild.id, minorUser, author)
    .then( (roles) => {
        msg = HELPERS.messages.confirm_minor_message(author, minorUser, role.name, roles.roles);
        return message.channel.send(msg);
    });
}

exports.handle = handle;
exports.help = help;