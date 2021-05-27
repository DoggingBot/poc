var TheGuild;
function injectGuild(guild) {
    TheGuild = guild;
}

async function writeToChannel(channelId, message) {
    var channel = TheGuild.channels.cache[channelId];
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
    userObj = TheGuild.members.cache[userId];
    return { 
        id:  userObj.id,
        nickname:  userObj.nickname,
        userid:  userObj.user.id,
        roles: userObj.roles.map(role => role.id)
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
        nickname:  userObj.nickname,
        username:  userObj.user.username,
        roles: userObj.roles.map(role => role.id)
    }
}

async function getExecutorForRoleChangeFromAuditLog(roleId, targetMemberId) {
    var auditlog = await TheGuild.fetchAuditLogs({
		limit: 1,
		type: 'MEMBER_UPDATE_ROLES'
	});

    var topOne = auditlog.entries.first();
    if (topOne == undefined) {
        return Promise.resolve({
            actionRequired: false
        });
    }
    if (topOne.changes == undefined) {
        console.log("Handled event with no audit log changes");
        return Promise.resolve({
            actionRequired: false
        });
    }
    if (topOne.changes[0]["new"] == undefined) {
        console.log("Handled event with no audit log NEW changes");
        return Promise.resolve({
            actionRequired: false
        });
    }

    var authorId = topOne.executor.id;

    if (CONFIG.bypassGMU.includes(authorId)) {
        console.log("Handled event performed by the ignored configuration list");
        return Promise.resolve({
            actionRequired: false
        });
    }

    //The audit entry represents the role and user
    if (topOne.changes[0]["new"][0].id === roleId && topOne.target == targetMemberId) {
        return Promise.resolve({
            authorId: authorId,
            auditAction: topOne.changes[0].key,
            actionRequired: true
        });
    }
}

exports.getExecutorForRoleChangeFromAuditLog = getExecutorForRoleChangeFromAuditLog;
exports.getRole = getRole;
exports.setRolesForMember = setRolesForMember;
exports.writeToChannel = writeToChannel;
exports.getMemberFromCache = getMemberFromCache;
exports.getMemberForceLoad = getMemberForceLoad;
exports.injectGuild = injectGuild;