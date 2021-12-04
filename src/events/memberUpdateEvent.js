var guildService = require('../services/guildService');
var drunkTankService = require('../services/drunktankService');
var persistenceService = require('../services/persistenceService');

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
Handle member changing
this fires for loads of stuff, so filter what we want to look for
// Looking for role changes and name changes only.
*/

async function handle(oldMember, newMember, event) {
	var namechange = false;
	var change = {o:"",n:""};
	var rolechange = false;
	
	// check if event fired from userUpdate or guildMemberUpdate
	if (event === "userUpdate") {
		// check only their username tag. Too many things fire for this.
		if (oldMember.tag !== newMember.tag) {
			// Actual Username/tag changed
			namechange = "Username Altered\r\n";
			change.o = oldMember.tag;
			change.n = newMember.tag;
		}
	} else if (event === "guildMemberUpdate") {
		if (oldMember.nickname !== newMember.nickname) {
			// Nickname set, updated, or removed.
			if (oldMember.nickname === null) {
				namechange = "Nickname Added\r\n";
				change.o = "";
				change.n = newMember.nickname;
			} else if (newMember.nickname === null) {
				namechange = "Nickname Removed\r\n";
				change.o = oldMember.nickname;
				change.n = "";
			} else {
				namechange = "Nickname Changed\r\n";
				change.o = oldMember.nickname;
				change.n = newMember.nickname;
			}
		}
	}
	// Was there a name change?
	if (namechange) {
		return guildService.writeToChannel('namesChannel',MESSAGES.user_name_change_msg(oldMember, namechange, change));
	}
	
	// Get back into guildMemberUpdate so we don't error out with userUpdate looking for a guild
	if (event === "guildMemberUpdate") {
		// Check role changes
		var oldRoles = oldMember._roles;
		var newRoles = newMember._roles;
		//check if the roles have changed
		if (JSON.stringify(oldRoles) === JSON.stringify(newRoles)) {
				//LOGGER.log("Handled event with no role changes");
				return;
		}
		
		// Identify the role.
		var role = null;
		oldRoles.forEach((r,i) => {
			if (newRoles.indexOf(r) === -1) {
				role = r;
			}
		});
		if (role === null) {
			newRoles.forEach((r,i) => {
				if (oldRoles.indexOf(r) === -1) {
					role = r;
				}
			});
		}
		
		guildService.getExecutorForRoleChangeFromAuditLog(role, oldMember.id)
		
		.then(async (responseObj) => {
				guild = newMember.guild.id;
				author = guildService.getMemberFromCache(responseObj.authorId);
				auditAction = responseObj.auditAction;
				// For drunktankRole only
				duration = CONFIG.servers[oldMember.guild.id].tankDuration;
				uom = CONFIG.servers[oldMember.guild.id].tankUOM;
				reason = "Manual ";
				
				if (role !== CONFIG.servers[oldMember.guild.id].drunktankRole) {
					// If it wasn't drunktankRole, we are logging who did it into the modlog.
					return await guildService.writeToChannel("modlogChannel", MESSAGES.log_role_change(author, newMember, role, auditAction));
				}

				// Drunktank Role is involved in this audit log for the affected user, and not done by a bypassing User.
				if (oldRoles.includes(CONFIG.servers[oldMember.guild.id].drunktankRole) && 
						!newRoles.includes(CONFIG.servers[oldMember.guild.id].drunktankRole) &&
						auditAction === "$remove") {
						//Looks like 2Drunk2Party was removed
						tankedUserJson = await persistenceService.getTankedUsers(oldMember.guild.id,true,oldMember.id);
						correctUser = false;
						Object.entries(tankedUserJson).forEach(([timetanked,tUserObj]) => {
							if (tUserObj.user_tanked === oldMember.id) {
								// This record is for the correct user that is still in the tank
								reason += "untanking";
								correctUser = true;
								tankedUserJson = tUserObj;
							}
						});
						if (correctUser) {
							return await drunkTankService.untankUser(guild, newMember, author, tankedUserJson, reason);
						} else {
							throw "User was not found in the tank!";
						}
				} 
				if (!oldRoles.includes(CONFIG.servers[oldMember.guild.id].drunktankRole) && 
						newRoles.includes(CONFIG.servers[oldMember.guild.id].drunktankRole) && 
						auditAction === "$add")	{
						//Looks like 2Drunk2Party was added
						reason += 'tanking';
						return drunkTankService.tankUser(guild, newMember, author, reason, duration, uom);
				}
		})/*
		.catch((ex) => {
				LOGGER.log("exception: " + ex);
				LOGGER.log(role + " was added or removed but we couldn't find the audit log for server " + oldMember.guild.id + ".");
		})*/;
	}
	return;
}

exports.handle = handle;
//exports.injectConfig = injectConfig;