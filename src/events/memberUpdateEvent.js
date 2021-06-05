
var guildService = require('../services/guildService');
var drunkTankService = require('../services/drunktankService');
var persistenceService = require('../services/persistenceService');

const HELPERS = require('../helpers/helpers');
const MESSAGES = require('../helpers/messages');
const LOGGER = require('../helpers/logger');

var CONFIG;
function injectConfig(_cfg) {
    CONFIG = _cfg;
}


/*
Handle member changing
this fires for loads of stuff, we are specifically only interested in roles
*/
async function handle(oldMember, newMember) {
	var oldRoles = oldMember._roles;
	var newRoles = newMember._roles;
    //check if the roles have changed
    if (JSON.stringify(oldRoles) === JSON.stringify(newRoles)) {
        LOGGER.log("Handled event with no role changes");
        return;
    }

    //ensure any role changes involves 2drunk2party
    if (!(oldRoles.includes(CONFIG.drunktankRole) || newRoles.includes(CONFIG.drunktankRole))) {
        LOGGER.log("Handled role change event that didn't involve 2drunk2party.");
        return;
    }

    guildService.getExecutorForRoleChangeFromAuditLog(CONFIG.drunktankRole, oldMember.id)
        .then((responseObj) => {
            tankedUserId = newMember.user.id;
            authorId = responseObj.authorId;
            reason = "Manual Tanking";
            duration = CONFIG.tankDuration;
            uom = CONFIG.tankUOM;
            auditAction = responseObj.auditAction;
    
            // Drunktank Role is involved in this audit log for the affected user, and not done by a bypassing User.
            if (oldRoles.includes(CONFIG.drunktankRole) && 
                !newRoles.includes(CONFIG.drunktankRole) &&
                auditAction === "$remove") {
                //Looks like 2Drunk2Party was removed
                tankedUserJson = persistenceService.getUser(tankedUserId); 
                return drunkTankService.untankUser(tankedUserId, authorId, tankedUserJson);
    
            } 
            if (!oldRoles.includes(CONFIG.drunktankRole) && 
                newRoles.includes(CONFIG.drunktankRole) && 
                auditAction === "$add")	{
                //Looks like 2Drunk2Party was added 
                return drunkTankService.tankUser(tankedUserId, authorId, reason, duration, uom);
            }
        })
        .catch(() => {
            LOGGER.log("2Drunk2Party was added or removed but we couldn't find the audit log.");
        });
}

exports.handle = handle;
exports.injectConfig = injectConfig;