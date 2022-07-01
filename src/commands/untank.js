function help(prefix) {  
  return prefix + "untank - Untank a user. usage: `" + prefix + "untank @user [reason]`\r\n"
}

async function handle(message) {
		msg = HELPERS.helpers.trimMsg(message);
    tokens = HELPERS.helpers.tokenize(msg.substr(1,msg.length -1 ));
        
		//Validate token length
    if (tokens[0] == "") {
        message.channel.send("Invalid arguments. Correct usage: " + CONFIG.servers[message.guild.id].commandPrefix + "untank @user [reason]");
        return;
    }
		var tankedMember = message.mentions.users.size;
    var bypassValidateMentions = false;
    if (tankedMember === 0) {
      // User left server before they were untanked, so we have to grab their id using a regex from the message content.
      // The user ID is then utilized to obtain their GuildMemberObject. We also need to bypass validateMentions(), so we should set a variable for that.
      bypassValidateMentions = true;
      tankedMember = tokens[0].replace("<@!","").replace(">","");
      tankedMember = {
        id: tankedMember
      };
      tankedMember.user = await message.client.users.fetch(tankedMember.id);
      //Write a unique log message to the blue log channel
      await SERVICES.guildService.writeToChannel('logChannel', "<@" + message.author.id + "> untanked " + tankedMember.user.tag + "(" + tankedMember.id + "), but they are not in the server anymore.");
      //Save the untanking directly, otherwise we get a rejection when trying to give them back any roles.
      SERVICES.persistenceService.saveUntanking(message.guild.id, tankedMember.id, message.author.id, "Time served - Cleanup user not in server");
      return;
    } else {
		  tankedMember = SERVICES.guildService.getMemberFromCache(message.mentions.users.first().id);
    }
    var author = SERVICES.guildService.getMemberFromCache(message.author.id);
    var role = await SERVICES.guildService.getRole(CONFIG.servers[message.guild.id].drunktankRole);
		//Get a reason
		var reason = HELPERS.helpers.getReason(tokens);
    
		// reason is optional, default assume time served.
		if (reason.replace(/[^A-Za-z0-9]/g, '') == "") {
        reason = "Default - assume time served.";
    }
		
		//Make sure we have a mention on the message
		if (!HELPERS.helpers.validateMentions(message, "untank")) {
        return;
    }

    userJson = await SERVICES.persistenceService.getTankedUsers(message.guild.id, true, tankedMember.id);
		var isTanked = false;
		Object.entries(userJson).forEach(([t,r]) => {
			if (r.user_tanked === tankedMember.id) {
				isTanked = r;
			}
		});
    if (!isTanked){
        //don't do anything if they are not in our log. we might strip them of their roles by accident.
        return message.channel.send("User " + tankedMember.user.tag + " (" + tankedMember.id + ") not found in tank log. Do it manually.");
    }

    return await SERVICES.drunkTankService.untankUser(message.guild.id, tankedMember, author, isTanked, reason)
      .then((rolesGivenBack)=> {
          msg = HELPERS.messages.confirm_untank_message(author, tankedMember, reason, role.name, rolesGivenBack.roles);
          return message.channel.send(msg);
      });
}

exports.handle = handle;
exports.help = help;