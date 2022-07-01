function help(prefix) {  
  return prefix + "adult - verify a user as an adult. usage: `" + prefix + "adult @user`\r\n";
}

async function handle(message) {
	msg = HELPERS.helpers.trimMsg(message);
    tokens = HELPERS.helpers.tokenize(msg.substr(1,msg.length -1 ));
        
	var adultMember = SERVICES.guildService.getMemberFromCache(message.mentions.users.first().id);
  var author = SERVICES.guildService.getMemberFromCache(message.author.id);
  var role = await SERVICES.guildService.getRole(CONFIG.servers[message.guild.id].minorRole);

  //Make sure we have a mention on the message
  if (!HELPERS.helpers.validateMentions(message, "adult")) {
    return;
  }

  userJson = await SERVICES.persistenceService.getMinorUsers(message.guild.id, adultMember.id);
  var suspected = false;
  Object.entries(userJson).forEach(([t,r]) => {
    if (r.user == adultMember.id) {
      suspected = r;
    }
  });
  if (!suspected){
    //don't do anything if they are not in our log. we might strip them of their roles by accident.
    return message.channel.send("User " + adultMember.user.tag + " (" + adultMember.id + ") not found in age-verification log. Do it manually.");
  }

  await SERVICES.minorService.verifyUser(message.guild.id, adultMember, author, suspected)
  .then((rolesGivenBack)=> {
      msg = HELPERS.messages.confirm_ageVerify_message(author, adultMember, role.name, rolesGivenBack.roles);
      return message.channel.send(msg);
  });
}

exports.handle = handle;
exports.help = help;