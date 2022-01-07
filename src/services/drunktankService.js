/*
tank a user

guildId = string guildId
userToTank = object GuildMember to be tanked
author = object GuildMember performing tank
reason = string rason for tanking
duration = string amount of time to tank
uom = string unit of measure for duration - minutes, hours, or days.
*/
async function tankUser(guildId, userToTank, author, reason, duration, uom) {
    HELPERS.logger.log("Drunk tanking " + userToTank.user.tag + " (" + userToTank.id + ") -- initiated by " + author.user.tag + " (" + author.id + ")");
  
    try {
        var rolesToTakeAway = await HELPERS.helpers.convertRoleIdArrayToRoleNameArray(userToTank._roles, SERVICES.guildService);
        //Check if they have any roles that we can't work with
				var rolesICannotTank = CONFIG.servers[guildId].rolesICannotTank === null ? [] : CONFIG.servers[guildId].rolesICannotTank;
					for (roleIcannotTank of rolesICannotTank) {
							if (userToTank._roles.includes(roleIcannotTank) || userToTank._roles.includes(CONFIG.servers[guildId].botUserRole) || userToTank._roles.includes(CONFIG.servers[guildId].botMasterRole) || userToTank.permissions.has(1 << 3)) {
									//We cannot tank this user
									roleObj = await SERVICES.guildService.getRole(roleIcannotTank);
									msg = "Hey <@" + author.id + ">, I cannot tank " + userToTank.displayName + " because they have the " + roleObj.name + " role. You'll have to do this one yourself."
									await SERVICES.guildService.writeToChannel('logChannel', msg);
									return;
							}
					}

        rolesToSet = [CONFIG.servers[guildId].drunktankRole];
        //Check if they have any roles we should ignore (ie not remove)
        var rolesToIgnore = CONFIG.servers[guildId].rolesToIgnore === null ? [] : CONFIG.servers[guildId].rolesToIgnore;
				for (roleIShouldIgnore of rolesToIgnore) {
            if (userToTank._roles.includes(roleIShouldIgnore)) {
                //the user has a role that we intend to ignore, so lets add it to the roles we are setting
                //so that we don't try to remove it.
                rolesToSet.push(roleIShouldIgnore);
            }
        }
				
				// Remember user's roles before we change them
				let rolesTaken = userToTank._roles;
				
        //Set the roles
        await SERVICES.guildService.setRolesForMember(userToTank.id, rolesToSet);

        var memberDisconnected = await SERVICES.guildService.disconnectMemberFromVC(userToTank.id);
        //Construct the blue log message
        msg = HELPERS.messages.log_blue_tank_msg(
            author, 
            userToTank, 
            reason,
						rolesToTakeAway,
            memberDisconnected
        );
				
				
				//////
				
				// Were they already in the tank? If so, close out that record before inserting a new record
				let tankees = await SERVICES.persistenceService.getTankedUsers(guildId, true, userToTank.id);
				var isTanked = false;
				Object.entries(tankees).forEach(([t,r]) => {
					if (r.user_tanked === userToTank.id) {
						isTanked = r;
					}
				});
				if (isTanked){
						// Update their current tank record first
						await SERVICES.persistenceService.saveUntanking(guildId, userToTank.id, author.id, "Already tanked - retanking");
				}
				
				//////
				
				//Save the tanking
        await SERVICES.persistenceService.saveTanking(guildId, userToTank.id, author.id, reason, duration, uom, rolesTaken);
				
        //Write the log message to the blue log channel
        await SERVICES.guildService.writeToChannel('logChannel', msg);

        

        //if enabled, write a notification to the drunk tank channel after 10 seconds
        if (CONFIG.servers[guildId].writeMessageToDrunkTank) {
            setTimeout(() => {
                msg = HELPERS.messages.tank_msg(
                    author, 
                    userToTank, 
                    reason,  
                    duration, 
                    uom
                );
                SERVICES.guildService.writeToChannel('tankChannel', msg, false);
            }, 10000);
        }
    
        //return a promise that resolves to true if successful, including the roles we took away
        return Promise.resolve({
            roles: rolesToTakeAway
        });
    }
    catch(error)  {
        var errorMsg = "Failed to handle tanking for user: " + userToTank.id + 
        "\r\nDo I have the permissions to manage this user?" +
        "\r\n"+error;

        await SERVICES.guildService.writeToChannel('logChannel', errorMsg);

        return Promise.reject(error);
    }
}

/*
untank a user

guildId = string guildId
untankedMember = object GuildMember that was tanked
author = object GuildMember that performed the untanking
untankedMemberJson = our tank record for this user if there is one
reason = string any reason given

Returns the roles we gave them back as a string
*/
async function untankUser(guildId, untankedMember, author, untankedMemberJson, reason) {

    //make sure we don't accidently give back the drunktank role
    var rolesToGiveBack = [];
		var rolesToGiveBackStr = "";
    var datediff = "";
    if (untankedMemberJson != undefined) {
        rolesToGiveBack = HELPERS.helpers.removeRoleFromArray(untankedMemberJson.roles_to_give_back, CONFIG.servers[guildId].drunktankRole);

        // Sometimes an empty string ends up in the array. Remove it so users can get untanked
        rolesToGiveBack.forEach((o,i) => {
            if (o === "") {
                rolesToGiveBack.splice(i,1);
            }
        });

        //Build a string that describes how long this person was tanked
        let ts = Date.now();
        datediff = HELPERS.helpers.getDateDiffString(ts, untankedMemberJson.time_tanked);
    } else {
        datediff = "unknown"
    }
    //Convert the role ID's to strings for readable output, or skip it if they had none
		if (untankedMemberJson.roles_to_give_back.join() !== "") {
			rolesToGiveBackStr = await HELPERS.helpers.convertRoleIdArrayToRoleNameArray(rolesToGiveBack, SERVICES.guildService);
		}

    try {
				await SERVICES.guildService.setRolesForMember(untankedMember.id, rolesToGiveBack);
				
				var bypassUserGone = SERVICES.guildService.getMemberFromCache(untankedMember.id) === undefined ? true : false;
				
				if (!bypassUserGone) {
					//Construct the blue log message
					msg = HELPERS.messages.log_blue_untank_msg(
							author,
							untankedMember,
							reason,
							datediff
					);

					//Write the log message to the blue log channel
					await SERVICES.guildService.writeToChannel('logChannel', msg);
				}
				
        //Save the untanking
        SERVICES.persistenceService.saveUntanking(guildId, untankedMember.id, author.id, reason);

        //Return a resolved promise with the roles we gave them back
        return Promise.resolve({
            success: true,
            roles: rolesToGiveBackStr
        });

    } catch(error)  {
        var errorMsg = "Failed to handle untanking for user: " + untankedMember.id + 
        "\r\nDo I have the permissions to manage this user?" +
        "\r\n"+error;

        await SERVICES.guildService.writeToChannel('logChannel', errorMsg);

        return Promise.reject(error);
    };
}

exports.tankUser = tankUser;
exports.untankUser = untankUser;