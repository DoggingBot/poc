/*
suspect a user of being underage

guildId = string guildId
minorUser = object GuildMember to be tanked
author = object GuildMember performing tank
*/
async function suspectUser(guildId, minorUser, author) {
    try {
        var rolesToTakeAway = await HELPERS.helpers.convertRoleIdArrayToRoleNameArray(minorUser._roles, SERVICES.guildService);
        //Check if they have any roles that we can't work with
		var rolesICannotTank = CONFIG.servers[guildId].rolesICannotTank === null ? [] : CONFIG.servers[guildId].rolesICannotTank;
        for (roleIcannotTank of rolesICannotTank) {
            if ((minorUser._roles.includes(roleIcannotTank) || minorUser._roles.includes(CONFIG.servers[guildId].modUserRole) || minorUser._roles.includes(CONFIG.servers[guildId].botUserRole) || minorUser._roles.includes(CONFIG.servers[guildId].botMasterRole) || minorUser.permissions.has(1 << 3))) {
                //We cannot tank this user
                roleObj = await SERVICES.guildService.getRole(roleIcannotTank);
                msg = "Hey <@" + author.id + ">, I cannot initiate age-verification on " + minorUser.displayName + " because they have the " + roleObj.name + " role."
                await SERVICES.guildService.writeToChannel('logChannel', msg);
                return false;
            }
        }

        rolesToSet = [CONFIG.servers[guildId].minorRole];
        //Check if they have any roles we should ignore (ie not remove)
        var rolesToIgnore = CONFIG.servers[guildId].rolesToIgnore === null ? [] : CONFIG.servers[guildId].rolesToIgnore;
		for (roleIShouldIgnore of rolesToIgnore) {
            if (minorUser._roles.includes(roleIShouldIgnore)) {
                //the user has a role that we intend to ignore, so lets add it to the roles we are setting
                //so that we don't try to remove it.
                rolesToSet.push(roleIShouldIgnore);
            }
        }
				
        // Remember user's roles before we change them
        let rolesTaken = minorUser._roles;

        //Set the roles
        await SERVICES.guildService.setRolesForMember(minorUser.id, rolesToSet);

        //Disconnect user from VC
        memberDisconnected = await SERVICES.guildService.disconnectMemberFromVC(minorUser.id);
        
        //Save the record
        await SERVICES.persistenceService.saveMinor(guildId, minorUser.id, author.id, rolesTaken);

        // Tell the user they are suspected of being underage, and what they will need to do.
        msg = HELPERS.messages.minor_msg(author, minorUser);
        SERVICES.guildService.writeToChannel('minorChannel', msg, false);

        // Try to DM the user
        dmSuccess = true;
        minorUser.send(
            minorUser.guild.name + " bot autoresponse - do not reply." +
            "\r\n" + minorUser.guild.name + " staff, namely <@" + author.id + ">, seems to think you might be underage." +
            "You will need to verify you are at least 18 years old as of today in order to have access to this server." + 
            "You can prove your age by showing some form of Governemnt Issued photo ID to a Staff member while on cam - " +
            "you can use the voice chat channel still accessible to you - " +
            "and you can cover up everything except your picture and your date of birth." +
            "\r\n\r\nYou can DM any staff member to complete this process, and it would be a good idea to do it in " +
            (CONFIG.servers[guildId].verifyAgeBy / 24) + " days or less, otherwise staff will have to just ban you..." +
            " and don't think you can outsmart me by leaving and rejoining, I know your user ID number."
        )
        .catch((e) => {
            dmSuccess = false;
        });


        //Write the log message to the blue log channel
        //Construct the blue log message
        msg = HELPERS.messages.log_blue_minor_msg(
            author, 
            minorUser, 
			rolesToTakeAway,
            memberDisconnected,
            dmSuccess
        );
        await SERVICES.guildService.writeToChannel('logChannel', msg);
        HELPERS.logger.log("Suspected minor " + minorUser.user.tag + " (" + minorUser.id + ") -- initiated by " + author.user.tag + " (" + author.id + ")");
        
        //return a promise that resolves to true if successful, including the roles we took away
        return Promise.resolve({
            roles: rolesToTakeAway
        });
    }
    catch(error)  {
        var errorMsg = "Failed to handle suspected minor user: " + minorUser.id + 
        "\r\nDo I have the permissions to manage this user?" +
        "\r\n"+error;

        await SERVICES.guildService.writeToChannel('logChannel', errorMsg);

        return false; // nothing handles previous return of Promise.reject(error);
    }
}

/*
Verify a user

guildId = string guildId
untankedMember = object GuildMember that was tanked
author = object GuildMember that performed the untanking
untankedMemberJson = our tank record for this user if there is one
reason = string any reason given

Returns the roles we gave them back as a string
*/
async function verifyUser(guildId, adultMember, author, suspectedMemberJson) {

    //make sure we don't accidently give back the drunktank role
    var rolesToGiveBack = [];
		var rolesToGiveBackStr = "";
    var datediff = "";
    if (suspectedMemberJson != undefined) {
        rolesToGiveBack = HELPERS.helpers.removeRoleFromArray(suspectedMemberJson.roles_to_give_back, CONFIG.servers[guildId].minorRole);

        // Sometimes an empty string ends up in the array. Remove it so users can get verified
        rolesToGiveBack.forEach((o,i) => {
            if (o === "") {
                rolesToGiveBack.splice(i,1);
            }
        });

        //Build a string that describes how long this person was suspected for
        let ts = Date.now();
        datediff = HELPERS.helpers.getDateDiffString(ts, suspectedMemberJson.time);
    } else {
        datediff = "unknown";
    }
    //Convert the role ID's to strings for readable output, or skip it if they had none
    if (suspectedMemberJson.roles_to_give_back.join() !== "") {
        rolesToGiveBackStr = await HELPERS.helpers.convertRoleIdArrayToRoleNameArray(rolesToGiveBack, SERVICES.guildService);
    }

    try {
        // We want to add the verified role to the user, so let's inject it now - if it is set.
        if (CONFIG.servers[guildId].verifiedRole !== null) {
            rolesToGiveBack.push(CONFIG.servers[guildId].verifiedRole);
        }

        await SERVICES.guildService.setRolesForMember(suspectedMemberJson.user, rolesToGiveBack);
        
        var bypassUserGone = SERVICES.guildService.getMemberFromCache(suspectedMemberJson.user) === undefined ? true : false;
        
        if (!bypassUserGone) {
            //Construct the blue log message
            msg = HELPERS.messages.log_blue_verified_msg(
                    author,
                    adultMember,
                    datediff
            );

            //Write the log message to the blue log channel
            await SERVICES.guildService.writeToChannel('logChannel', msg);
        }
            
        // Remove the user from the suspected Minors list
        SERVICES.persistenceService.removeMinor(guildId, adultMember.id);

        //Return a resolved promise with the roles we gave them back
        return Promise.resolve({
            success: true,
            roles: rolesToGiveBackStr
        });

    } catch(error)  {
        var errorMsg = "Failed to handle age-verification for user: " + adultMember.id + 
        "\r\nDo I have the permissions to manage this user?" +
        "\r\n"+error;

        await SERVICES.guildService.writeToChannel('logChannel', errorMsg);

        return Promise.reject(error);
    };
}

exports.suspectUser = suspectUser;
exports.verifyUser = verifyUser;