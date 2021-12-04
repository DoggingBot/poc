var persistenceService = require('./persistenceService');
var guildService = require('./guildService');

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
tank a user

tankedMember = Object GuildMember
authorId = Object GuildMember
reason = string
duration = string
uom = string
*/
async function tankUser(guild, userToTank, author, reason, duration, uom) {
    LOGGER.log("Drunk tanking " + userToTank.user.tag + " (" + userToTank.id + ") -- initiated by " + author.user.tag + " (" + author.id + ")");
  
    try {
        var rolesToTakeAway = await HELPERS.convertRoleIdArrayToRoleNameArray(userToTank._roles, guildService);
        //Check if they have any roles that we can't work with
				var rolesICannotTank = CONFIG.servers[guild].rolesICannotTank === null ? [] : CONFIG.servers[guild].rolesICannotTank;
					for (roleIcannotTank of rolesICannotTank) {
							if (userToTank._roles.includes(roleIcannotTank) || userToTank._roles.includes(CONFIG.servers[guild].botUserRole) || userToTank._roles.includes(CONFIG.servers[guild].botMasterRole) || userToTank.permissions.has(1 << 3)) {
									//We cannot tank this user
									roleObj = await guildService.getRole(roleIcannotTank);
									msg = "Hey <@" + author.id + ">, I cannot tank " + userToTank.displayName + " because they have the " + roleObj.name + " role. You'll have to do this one yourself."
									await guildService.writeToChannel('logChannel', msg);
									return;
							}
					}

        rolesToSet = [CONFIG.servers[guild].drunktankRole];
        //Check if they have any roles we should ignore (ie not remove)
        var rolesToIgnore = CONFIG.servers[guild].rolesToIgnore === null ? [] : CONFIG.servers[guild].rolesToIgnore;
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
        await guildService.setRolesForMember(userToTank.id, rolesToSet);

        var memberDisconnected = await guildService.disconnectMemberFromVC(userToTank.id);
        //Construct the blue log message
        msg = MESSAGES.log_blue_tank_msg(
            author, 
            userToTank, 
            reason,
						rolesToTakeAway,
            memberDisconnected
        );
				
				
				//////
				
				// Were they already in the tank? If so, close out that record before inserting a new record
				let tankees = await persistenceService.getTankedUsers(guild, true, userToTank.id);
				var isTanked = false;
				Object.entries(tankees).forEach(([t,r]) => {
					if (r.user_tanked === userToTank.id) {
						isTanked = r;
					}
				});
				if (isTanked){
						// Update their current tank record first
						await persistenceService.saveUntanking(guild, userToTank.id, author.id, "Already tanked - retanking");
				}
				
				//////
				
				//Save the tanking
        await persistenceService.saveTanking(guild, userToTank.id, author.id, reason, duration, uom, rolesTaken);
				
        //Write the log message to the blue log channel
        await guildService.writeToChannel('logChannel', msg);

        

        //if enabled, write a notification to the drunk tank channel after 10 seconds
        if (CONFIG.servers[guild].writeMessageToDrunkTank) {
            setTimeout(() => {
                msg = MESSAGES.tank_msg(
                    author, 
                    userToTank, 
                    reason,  
                    duration, 
                    uom
                );
                guildService.writeToChannel('tankChannel', msg, false);
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

        await guildService.writeToChannel('logChannel', errorMsg);

        return Promise.reject(error);
    }
}

/*
untank a user

untankedMember = string userId
authorId = string userId 
untankedMemberJson = our tank record for this user if there is one

Returns the roles we gave them back as a string
*/
async function untankUser(guild, untankedMember, author, untankedMemberJson, reason) {

    //make sure we don't accidently give back the drunktank role
    var rolesToGiveBack = [];
		var rolesToGiveBackStr = "";
    var datediff = "";
    if (untankedMemberJson != undefined) {
        rolesToGiveBack = HELPERS.removeRoleFromArray(untankedMemberJson.roles_to_give_back, CONFIG.servers[guild].drunktankRole);

        // Sometimes an empty string ends up in the array. Remove it so users can get untanked
        rolesToGiveBack.forEach((o,i) => {
            if (o === "") {
                rolesToGiveBack.splice(i,1);
            }
        });

        //Build a string that describes how long this person was tanked
        let ts = Date.now();
        datediff = HELPERS.getDateDiffString(ts, untankedMemberJson.time_tanked);
    } else {
        datediff = "unknown"
    }
    //Convert the role ID's to strings for readable output, or skip it if they had none
		if (untankedMemberJson.roles_to_give_back.join() !== "") {
			rolesToGiveBackStr = await HELPERS.convertRoleIdArrayToRoleNameArray(rolesToGiveBack, guildService);
		}

    try {
				await guildService.setRolesForMember(untankedMember.id, rolesToGiveBack);

        //Construct the blue log message
        msg = MESSAGES.log_blue_untank_msg(
            author,
            untankedMember,
						reason,
            datediff
        );

        //Write the log message to the blue log channel
        await guildService.writeToChannel('logChannel', msg);

        //Save the untanking
        persistenceService.saveUntanking(guild, untankedMember.id, author.id, reason);

        //Return a resolved promise with the roles we gave them back
        return Promise.resolve({
            success: true,
            roles: rolesToGiveBackStr
        });

    } catch(error)  {
        var errorMsg = "Failed to handle untanking for user: " + untankedMember.id + 
        "\r\nDo I have the permissions to manage this user?" +
        "\r\n"+error;

        await guildService.writeToChannel('logChannel', errorMsg);

        return Promise.reject(error);
    };
}

//exports.injectConfig  = injectConfig;
exports.tankUser = tankUser;
exports.untankUser = untankUser;