var guildService = require('../services/guildService');
var inviteService = require('../services/inviteService');

const HELPERS = require('../helpers/helpers');
const MESSAGES = require('../helpers/messages');

/*
Handle member leaving
We want to remove them from the checktank list // NO LONGER NECESSARY
CHANGED FUNCTIONALITY; now triggers all logging options on user leave
*/
async function handle(invite, old) {
  var cfg = CONFIG.servers[invite.guild.id];
	var msg = "";
		
	// is the invite new, or old?
	if (old) {
		// The invite is old, so it was a deleted invite. Update it in the DB and get its returned invite info.
		// First, fetch the saved invite from db so we have the inviter ID.
		let db_invite = await inviteService.getInvites(cfg.serverID);
		db_invite[invite.code].code = invite.code;
		db_invite = db_invite[invite.code];
		let refreshedUserObj = await invite.client.users.fetch(db_invite.inviter);
		refreshedInvite = await inviteService.updateInvite(cfg.serverID, db_invite, true);
		msg += "Invite **" + refreshedInvite.code + "** deleted. It was " + (refreshedInvite.uses === null ? "never used." : (refreshedInvite.uses == 1 ? "used once." : "used " + refreshedInvite.uses + " times.")) + " It was created by <@" + refreshedUserObj.id + "> (" + refreshedUserObj.tag + ") (" + refreshedUserObj.id + ")";
	} else {
		// The invite was created, it has what we need
		await inviteService.createInvite(cfg.serverID, invite);
		msg += "Invite **" + invite.code + "** created by <@" + invite.inviter.id + "> (" + invite.inviter.tag + ") (" + invite.inviter.id + ")";
	}
	await guildService.writeToChannel('invitesChannel', msg);
}

exports.handle = handle;