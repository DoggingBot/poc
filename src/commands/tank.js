function help(prefix) {
    return prefix + "tank - drunk tanks a user. usage: `" + prefix + "tank @user reason`\r\n";
}

async function handle(message) {
    msg = HELPERS.helpers.trimMsg(message);
	tokens = HELPERS.helpers.tokenize(msg.substr(1,msg.length -1 ));
    //Validate token length
    if (tokens.length < 2) {
        message.channel.send("Invalid arguments. Correct usage: " + CONFIG.servers[message.guild.id].commandPrefix + "tank @user reason");
        return;
    }
		
    var tankedMember = SERVICES.guildService.getMemberFromCache(message.mentions.users.first().id);
    var author = SERVICES.guildService.getMemberFromCache(message.author.id);
    var role = await SERVICES.guildService.getRole(CONFIG.servers[message.guild.id].drunktankRole);

    //Check if we have to handle customized timings
	var tankedFor = HELPERS.helpers.parseDurationFromTokens(tokens, message.guild.id);

    //Get a reason
    var reason = HELPERS.helpers.getReason(tankedFor.newTokens);
		
    //Make sure we have a reason
    if (!HELPERS.helpers.validateReason(reason, message)) {
        return;
    }
		
    //Make sure we have a mention on the message
    if (!HELPERS.helpers.validateMentions(message, "tank")) {
        return;
    }

    //actually tank the user
    return await SERVICES.drunkTankService.tankUser(message.guild.id, tankedMember, author, reason, tankedFor.duration, tankedFor.uom)
    .then( (roles) => {
        msg = HELPERS.messages.confirm_tank_message(author, tankedMember, reason, role.name, roles.roles);
        return message.channel.send(msg);
    });
}

exports.handle = handle;
exports.help = help;