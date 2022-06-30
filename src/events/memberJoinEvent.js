
var guildService = require('../services/guildService');
var drunkTankService = require('../services/drunktankService');
var persistenceService = require('../services/persistenceService');
var inviteService = require('../services/inviteService');
//var syncTankService = require('../services/syncTankService'); DEPRECATED AND REMOVED; uses DB now instead of DRP

const HELPERS = require('../helpers/helpers');
const MESSAGES = require('../helpers/messages');
const LOGGER = require('../helpers/logger');

/* DEPRECATED AND REMOVED; CONFIG lives in global namespace of main.js
var CONFIG;
function injectConfig(_cfg) {
    CONFIG = _cfg;
}
*/

/*
Handle member joining
we want to check if they have an outstanding tanking, and resume it.
Takes over Discord Role Persistence due to database logging.
*/
async function handle(newMember) {
	// First, handle the invite check.
	let db_invites = await inviteService.getInvites(newMember.guild.id);
  if (!Object.keys(db_invites).length) {
		// We don't have any invites saved!
		return await guildService.writeToChannel('logChannel',
			"<@&" + CONFIG.servers[newMember.guild.id].botMasterRole + "> " +
		  "You need to fill the invites table in the database with your invites!" +
			"\r\nRun the command `" + CONFIG.servers[newMember.guild.id].commandPrefix + "config getinvites`"
		);
	}
	let g_invites = await inviteService.getGuildInvites(newMember.guild);
	let invite = null;
	g_invites.forEach((i,k)=>{
		let adjusted_uses = 0;
		if (typeof db_invites[i.code].uses === "object") {
			Object.entries(db_invites[i.code].uses).forEach(([u,t]) => {
				adjusted_uses += t.length;
			});
			adjusted_uses += db_invites[i.code].dummies;
		} else {
			adjusted_uses = db_invites[i.code].uses;
		}
		if ( adjusted_uses === (i.uses - 1)) {
			// Found the code that was used by this joining user.
			invite = i;
		}
	});
	// send join message
	await guildService.writeToChannel("invitesChannel", MESSAGES.user_join_msg(newMember, invite));
	// update the invite and add a usage
	await inviteService.addInviteUse(newMember, invite);
	
	// Now, handle tank persistence
	var user = await persistenceService.getTankedUsers(newMember.guild.id, true, newMember.id);
	let isTanked = false;
	Object.entries(user).forEach(([t,r]) => {
		if (r.user_tanked === newMember.id) {
			// This user was in the tank. Check if their time is up.
			isTanked = r;
		}
	});
	if (isTanked) {
		if (Date.now() >= isTanked.time_to_untank) {
			// Their time is up, call untank command.
			let botMember = await guildService.getMemberForceLoad(newMember.client.id);
			return await drunkTankService.untankUser(newMember.guild.id, newMember, botMember, isTanked, "Time served");
		} else {
			return await guildService.setRolesForMember(newMember.id, [CONFIG.servers[newMember.guild.id].drunktankRole]);
		}
	}
}

exports.handle = handle;
//exports.injectConfig = injectConfig;