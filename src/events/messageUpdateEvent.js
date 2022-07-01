function mentionEdit(om, nm) {
  let old = {"users": [], "roles": []};
  let edt = {"users": [], "roles": []};
	
  // get lists of mentioned users
  om.mentions.users.forEach((o,i) => {
    old.users.push(o.id);
  });
  if (!!nm) {
    nm.mentions.users.forEach((o,i) => {
      edt.users.push(o.id);
    });
  }
  // get lists of mentioned roles
  om.mentions.roles.forEach((o,i) => {
    old.roles.push(o.id);
  });
  if (!!nm) {
    nm.mentions.roles.forEach((o,i) => {
      old.roles.push(o.id);
    });
  }
  old.users.sort();
  old.roles.sort();
  edt.users.sort();
  edt.roles.sort();

  // Only logging if the old message had a mention that was removed via an edit
  if (
    (!om.mentions.everyone) &&
    (old.users.length === 0) &&
    (old.roles.length === 0)
  ) {
    return false; // No mentions on previous message
  }
	
  // Specifically for messages that are deleted instead of updated -- trolls shadow-tag by delete sometimes and the audit log won't always show it.
  if (!nm) {
    // passed specifically by the messageDelete event listener
    msg = "<@" + om.author.id + "> (" + om.author.tag + ") (" + om.author.id + ") - **__DELETED MESSAGE__** <" + om.url + "> messageID " + om.id + ":";
    if (msg.length + om.content.length <= 1998) {
      SERVICES.guildService.writeToChannel("mentionsLog", msg + "\n" + om.content);
    } else {
      SERVICES.guildService.writeToChannel("mentionsLog", msg);
      SERVICES.guildService.writeToChannel("mentionsLog", om.content);
    }
    return true;
  }

  // Allow tracking of what changes occurred -- currently not articulating what changes occur, just logging when one does happen
  let changes = {};
  if ((om.mentions.everyone) && (!nm.mentions.everyone)) {
	changes.everyone = true;
  }
  if (JSON.stringify(old.users) !== JSON.stringify(edt.users)) {
	changes.users = [old.users, edt.users];
  }
  if (JSON.stringify(old.roles) !== JSON.stringify(edt.roles)) {
	changes.roles = [old.roles, edt.roles];
  }

  if (CONFIG.servers[om.guild.id].bypassGMU.includes(om.author.id)) {
    return false;
  }

  // Log the previous message content along with its author/tag/id/url if any changes occurred
  if (JSON.stringify(changes) !== "{}") {
	msg = "<@" + nm.author.id + "> (" + nm.author.tag + ") (" + nm.author.id + ") - <" + om.url + ">:";		
    if (msg.length + om.content.length <= 1998) {
      SERVICES.guildService.writeToChannel("mentionsLog", msg + "\n" + om.content);
    } else {
      SERVICES.guildService.writeToChannel("mentionsLog", msg);
      SERVICES.guildService.writeToChannel("mentionsLog", om.content);
    }
    return true;
  } else {
	return false;
  }
}

exports.mentionEdit = mentionEdit;