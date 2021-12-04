var guildService = require('../services/guildService');
var drunkTankService = require('../services/drunktankService');
var persistenceService = require('../services/persistenceService');
var inviteService = require('../services/inviteService');

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
Handle member leaving
We want to remove them from the checktank list // NO LONGER NECESSARY
CHANGED FUNCTIONALITY; now triggers all logging options on user leave
*/
async function handle(user) {	
	// Get invites, discover who invited them if possible
	let invites = await inviteService.getInvites(user.guild.id);
	let invite = null;
	Object.entries(invites).forEach(([k,i])=>{
		if (typeof (i.uses) === "object") {
			if (i.uses[user.id] !== undefined) {
				// User has used this code before, is it their last used code?
				if (i.uses[user.id].includes(user.joinedTimestamp)) {
					invite = i;
					invite.code = k;
				}
			}
		}
	});
	
	var ts = Date.now() - 5000;
	
	// Try to determine if the user was kicked, banned, or if they left on their own
	let audit = await user.guild.fetchAuditLogs({limit: 3, type: 'MEMBER_KICK'});
	for (let [key, value] of audit.entries) {
		if ((value.target == user.id) && (value.createdTimestamp > ts)) {
			user.leaveReason = "This user was kicked by <@" + value.executor + "> for " + (value.reason !== null ? value.reason : "a reason not specified.");
		}
	}
	audit = await user.guild.fetchAuditLogs({limit: 3, type: 'MEMBER_BAN_ADD'});
	for (let [key, value] of audit.entries) {
		// Banned users need to have any open tanking record closed.
		let tank = await persistenceService.getTankedUsers(user.guild.id, true, user.id);
		if (JSON.stringify(tank) !== "{}") {
			// A record was found for this userId that was still open. Untank them.
			await drunkTankService.untankUser(user.guild.id, user, user.client, tank, "Banned");
		}
		// Handle the leave message
		if ((value.target == user.id) && (value.createdTimestamp > ts)) {
			user.leaveReason = "This user was banned by <@" + value.executor + "> for " + (value.reason !== null ? value.reason : "a reason not specified.");
		}
	}
	if (user.leaveReason === undefined) {
		// They weren't kicked, they left on their own
		user.leaveReason = "This user left on their own.";
	}
	
	await guildService.writeToChannel('invitesChannel', MESSAGES.user_leave_msg(user, invite));
}

exports.handle = handle;
//exports.injectConfig = injectConfig;
