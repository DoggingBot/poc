async function handle(invite, old) {
  var cfg = CONFIG.servers[invite.guild.id];
	var msg = "";
		
	// is the invite new, or old?
	if (old) {
		// The invite is old, so it was a deleted invite. Update it in the DB and get its returned invite info.
		// First, fetch the saved invite from db so we have the inviter ID.
		let db_invite = await SERVICES.inviteService.getInvites(cfg.serverID);
		db_invite[invite.code].code = invite.code;
		db_invite = db_invite[invite.code];
		let refreshedUserObj = await invite.client.users.fetch(db_invite.inviter);
		refreshedInvite = await SERVICES.inviteService.updateInvite(cfg.serverID, db_invite, true);
		msg += "Invite **" + refreshedInvite.code + "** deleted. It was " + (refreshedInvite.uses === null ? "never used." : (refreshedInvite.uses == 1 ? "used once." : "used " + refreshedInvite.uses + " times.")) + " It was created by <@" + refreshedUserObj.id + "> (" + refreshedUserObj.tag + ") (" + refreshedUserObj.id + ")";
	} else {
		// The invite was created, it has what we need
		await SERVICES.inviteService.createInvite(cfg.serverID, invite);
		msg += "Invite **" + invite.code + "** created by <@" + invite.inviter.id + "> (" + invite.inviter.tag + ") (" + invite.inviter.id + ")";
	}
	await SERVICES.guildService.writeToChannel('invitesChannel', msg);
}

exports.handle = handle;