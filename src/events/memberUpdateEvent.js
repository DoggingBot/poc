
var guildService = require('../services/guildService');
var drunkTankService = require('../services/drunktankService');
var persistenceSrvice = require('../services/drunktankService');

const HELPERS = require('../helpers/helpers');
const MESSAGES = require('../helpers/messages');

var CONFIG;
function injectConfig(_cfg, guildSvc) {
    CONFIG = _cfg;
    guildService = guildSvc;
}


/*
Handle member changing
this fires for loads of stuff, we are specifically only interested in roles
*/
async function handle(oldMember, newMember) {
	var oldRoles = oldMember._roles;
	var newRoles = newMember._roles;
    //check if the roles have changed
    if (JSON.stringify(oldRoles) == JSON.stringify(newRoles)) {
        console.log("Handled event with no role changes");
        return;
    }

    //ensure any role changes involves 2drunk2party
    if (!(oldRoles.includes(config.drunktankRole) || newRoles.includes(config.drunktankRole))) {
        console.log("Handled role change event that didn't involve 2drunk2party.");
        return;
    }

    var responseObj = await guildService.getExecutorForRoleChangeFromAuditLog(CONFIG.drunktankRole, oldMember.id);

    //We found the audit entry for this event, lets now check if the 2Drunk2Party was removed
    if (responseObj.actionRequired) {
        tankedUserId = newMember.user.id;
        authorId = responseObj.authorId;
        reason = "Manual Tanking";
        duration = config.tankDuration;
        uom = config.tankUOM;
        auditAction = responseObj.auditAction;


		// Drunktank Role is involved in this audit log for the affected user, and not done by a bypassing User.
		if (oldRoles.includes(config.drunktankRole) && 
            !newRoles.includes(config.drunktankRole) &&
		    auditAction === "$remove") {
			//Looks like 2Drunk2Party was removed
            tankedUserJson = persistenceSrvice.getUser(tankedUserId); 
			return drunkTankService.untankUser(tankedUser, authorId, tankedUserJson);

		} 
        if (!oldRoles.includes(config.drunktankRole) && 
            newRoles.includes(config.drunktankRol) && 
		    auditAction === "$add")	{
			//Looks like 2Drunk2Party was added 
            return drunkTankService.tankUser(tankedUserId, authorId, reason, duration, uom);
		}
    }
}

exports.handle = handle;
exports.injectConfig = injectConfig;