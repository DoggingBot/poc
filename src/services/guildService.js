var TheGuild;
var bufferService = require('./bufferService');
function injectGuild(guild) {
    TheGuild = guild;
}

/* DEPRECATED AND REMOVED; CONFIG lives in global namespace of main.js
var CONFIG;
function injectConfig(_cfg) {
    CONFIG = _cfg;
}
*/

const LOGGER = require('../helpers/logger');

async function writeToChannel(channel, message, doBuffer) {
	  // Ensure the channel requested exists, otherwise send the message to buffers and notify admins in systemChannel
		if (arguments.length === 2) {
			doBuffer = true;
		}
		var ch = TheGuild.channels.cache.get(CONFIG.servers[TheGuild.id][channel]);
		if (((ch === undefined) || (ch === null)) && (doBuffer)) {
			// The channel is no longer correct, save the message to the buffers
			bufferService.saveBuffer(channel,message);
			// now notify Admins of the occurence in the systemChannel
			var msg = "<@&" + CONFIG.servers[TheGuild.id].botMasterRole + "> the invites channel doesn't exist!" + 
			"\r\n Run " + "`" + CONFIG.servers[TheGuild.id].commandPrefix + "config " + channel.replace("Channel","") + " <channel>` to fix it.";
			
			await writeToChannel(Theguild.systemChannelID, msg);
		}
    return ch.send(message);
}

async function getRole(roleId) {
    roleObj = await TheGuild.roles.fetch(roleId, false, true);
    return {
        id: roleObj.id,
        name: roleObj.name,
        members: roleObj.members.map(member => member.id)
    };
}

function getMemberFromCache(userId) {
    return TheGuild.members.cache.get(userId); // return the actual cached member object
}

async function setRolesForMember(userId, roles) {
    fetchObj = {
        user: userId,
        cache: false,
        force: true
    };
		roles = ((roles.length === 1) && (roles[0] === "")) ? [] : roles;
    userObj = await TheGuild.members.fetch(fetchObj).catch((e)=>{return null;});
    return userObj.roles.set(roles);
}

async function getMemberForceLoad(userId) {
    fetchObj = {
        user: userId,
        cache: false,
        force: true
    };
    return await TheGuild.members.fetch(fetchObj).catch((e)=>{return null;}); // return the actual refreshed member object
}

async function getExecutorForRoleChangeFromAuditLog(roleId, targetMemberId) {
	// Delayed audit logs can cause the bot to fail here. Allow the bot to retry a few times before giving up.
	// If the bot ultimately fails to find the audit log entry (failure on Discord API to produce an audit log entry), return a rejection.
	// Promise.reject() should be handled by the caller to determine how this should proceed.
	
	var byBot = false;
	
	for (i = 0; i < 5; i++) {
		var auditlog = await TheGuild.fetchAuditLogs({
			limit: 5,
			type: 'MEMBER_UPDATE_ROLES'
		});

		for (let [key, value] of auditlog.entries) {
			if (value == undefined) {
				continue;
			}
			if (value.changes == undefined) {
				continue;
			}
			if (value.changes[0]["new"] == undefined) {
				continue;
			}

			if (value.changes[0]["new"][0].id === roleId && value.target == targetMemberId) {
				// Don't break out for bypassing user UNLESS the full audit log matches
				var authorId = value.executor.id;
				if (CONFIG.servers[TheGuild.id].bypassGMU.includes(authorId)) {
					byBot=true;
					continue;
				}
				
				return Promise.resolve({
					authorId: authorId,
					auditAction: value.changes[0].key,
					actionRequired: true
				});
			}
		}
		
		if (byBot) {
			continue; // breaks out of this loop as well
		}
		
		// Failed to find the audit log entry on this run. Make the loop await a 1 second timeout before continuing.
		await new Promise((resolve,reject) => {
      setTimeout(function(){resolve();},1000);
    });
	}
	
	var result = "BYPASS";
	if (byBot) {
			LOGGER.log("Detected role change event performed by a bypassing user in server " + TheGuild.id + ".");
	}
	else {
			LOGGER.log("Detected role change event and could not find audit log entry in server " + TheGuild.id + ".");
			result = "FAILURE";
	}
	return Promise.reject(result);
}

async function disconnectMemberFromVC(userId) {
    fetchObj = {
        user: userId,
        cache: false,
        force: true
    };
    userObj = await TheGuild.members.fetch(fetchObj).catch((e)=>{return null;});

    try {
        if (userObj.voice != undefined) {
            if (userObj.voice.channel != undefined) {
                await userObj.voice.kick(); // v13 is .disconnect()
                return true;
            }
        }
    }
    catch {
        return false;
    }
    return false;
}

exports.disconnectMemberFromVC = disconnectMemberFromVC;
exports.getExecutorForRoleChangeFromAuditLog = getExecutorForRoleChangeFromAuditLog;
exports.getRole = getRole;
exports.setRolesForMember = setRolesForMember;
exports.writeToChannel = writeToChannel;
exports.getMemberFromCache = getMemberFromCache;
exports.getMemberForceLoad = getMemberForceLoad;
exports.injectGuild = injectGuild;
//exports.injectConfig = injectConfig;
