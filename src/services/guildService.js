var TheGuild;
function injectGuild(guild) {
    TheGuild = guild;
}
var CONFIG;

function injectConfig(_cfg) {
    CONFIG = _cfg;
}

const LOGGER = require('../helpers/logger');

async function writeToChannel(channelId, message) {
    var channel = TheGuild.channels.cache.get(channelId);
    return channel.send(message);
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
    userObj = TheGuild.members.cache.get(userId);

    return { 
        id:  userObj.id,
        nickname:  userObj.nickname == null ? userObj.user.username : userObj.nickname,
        userid:  userObj.user.id,
        roles: userObj._roles//.map(role => role.id)
    }
}

async function setRolesForMember(userId, roles) {
    fetchObj = {
        user: userId,
        cache: false,
        force: true
    };

    userObj = await TheGuild.members.fetch(fetchObj);
    return userObj.roles.set(roles);
}

async function getMemberForceLoad(userId) {
    fetchObj = {
        user: userId,
        cache: false,
        force: true
    };
    userObj = await TheGuild.members.fetch(fetchObj);

    return { 
        id:  userObj.id,
        nickname:  userObj.nickname == null ? userObj.user.username : userObj.nickname,
        username:  userObj.user.username,
        roles: userObj._roles
    }
}

async function getExecutorForRoleChangeFromAuditLog(roleId, targetMemberId) {
    var auditlog = await TheGuild.fetchAuditLogs({
		limit: 5,
		type: 'MEMBER_UPDATE_ROLES'
	});

    var byBot = false;

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
    
        var authorId = value.executor.id;
        if (CONFIG.bypassGMU.includes(authorId)) {
            byBot=true;
            continue;
        }

        if (value.changes[0]["new"][0].id === roleId && value.target == targetMemberId) {
            return Promise.resolve({
                authorId: authorId,
                auditAction: value.changes[0].key,
                actionRequired: true
            });
        }
    }
    if (byBot) {
        LOGGER.log("Detected Drunk tank event and could not find corresponding audit entry. Looks like it might have been one of the bots.");
    }
    else {
        LOGGER.log("Detected Drunk tank event and could not find corresponding audit entry. This is bad.");
    }
    return Promise.reject();
}

async function disconnectMemberFromVC(userId) {
    fetchObj = {
        user: userId,
        cache: false,
        force: true
    };
    userObj = await TheGuild.members.fetch(fetchObj);

    try {
        if (userObj.voice != undefined) {
            if (userObj.voice.channel != undefined) {
                await userObj.voice.kick();
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
exports.injectConfig = injectConfig;