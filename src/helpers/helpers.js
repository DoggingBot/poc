var moment = require('moment');

function fisherYates(arr) {
	for (var i = arr.length - 1; i > 0; i--) {
		const swapIndex = Math.floor(Math.random() * (i + 1));
		const currentIndex = arr[i];
		const indexToSwap = arr[swapIndex];
		arr[i] = indexToSwap;
		arr[swapIndex] = currentIndex;
	}
	return arr;
}

function getDateDiffString(future, past) {
    var mPast = moment(past);
    var mFuture = moment(future);

    hours = mFuture.diff(mPast, 'hours', true)
    roundedHours = mFuture.diff(mPast, 'hours', false);

    if (hours < 1) {
        mins = mFuture.diff(mPast, 'minutes', false);
        return mins + " minute" + (mins==1?"":"s");
    }  
    else if (hours < 24) {
        if (roundedHours == hours) {
            return roundedHours + " hour" + (roundedHours>1?"s":"");
        }
        else {
            roundedMinutes = Math.round((hours-roundedHours) * 60);
            return roundedHours + " hours and " + roundedMinutes + " minute" + (roundedMinutes>1?"s":"");
        }
    }
    else  {
        days = Math.floor(hours / 24);
        realHours = roundedHours - (days * 24);
        
        if (realHours == 0) {
            return days + " day" + (days == 1?"":"s");
        }
        else {
            return days + " day" + (days == 1?"":"s") + " and " + realHours + " hour" + (realHours>1?"s":"");
        }

    }
}

function getReason(tokens) {
    reason = "";
    for  (n = 1; n < tokens.length; n++) {
        reason += tokens[n] + " ";
    } 
    return reason;
}
function validateReason(reason, message) {
    if (reason.replace(/[^A-Za-z0-9]/g, '') == "") {
        message.channel.send("Invalid arguments. You must enter a reason. Correct usage: " + CONFIG.servers[message.guild.id].commandPrefix + "tank @user reason");
        return false;
    }
    return true;
}

function validateMentions(message, command) {
	  let r;
		switch (command) {
		  case "tank":
			  r = " reason";
				break;
		  case "untank":
			  r = " [reason]";
				break;
			default:
				r = "";
		}
		
    if (message.mentions.users.size == 0) {
        message.channel.send("Invalid arguments. You need to @ the user to use this command. \r\nCorrect usage: " + CONFIG.servers[message.guild.id].commandPrefix + command + " @user" + r);
        return false;
    }

    if (message.mentions.users.size > 1) {
        message.channel.send("Invalid arguments. More than one user @mentioned.\r\nCorrect usage:" + CONFIG.servers[message.guild.id].commandPrefix + command + " @user " + r);
        return false;
    }

    return true;
}

function tokenize(m) {
    return m.split(" ");
}

function trimCommand(message) {
    let command = message.content.toLowerCase().split(" ")[0];
    command = command.slice(CONFIG.servers[message.guild.id].commandPrefix.length);
    return command;
}

function trimMsg(message) {
    let command = message.content.toLowerCase().split(" ")[0];
    msg = message.content.slice(command.length); 
    return msg;
}

function parseDurationFromTokens(tokens, guild) {
    // For finding the possible existence of a specified duration/UoM, we have to set the defaults first found in config. All references to the config defaults must be swapped over to these new local-scope variables.
    var specifiedDuration = CONFIG.servers[guild].tankDuration; // "12"
    var specifiedUOM = CONFIG.servers[guild].tankUOM; // "hours"
    var mins = /^\d+m$/; // regex matches 1+ digits then an 'm' for minutes
    var hrs = /^\d+h$/; // regex matches 1+ digits then an 'h' for hours
    var days = /^\d+d$/; // regex matches 1+ digits then a 'd' for days

    // validate the second arg as the only acceptable location for a specified time/UoM. If the arg doesn't validate for a specified time/UoM, it stays as part of the reason arg.
    if ((mins.test(tokens[1])) || (hrs.test(tokens[1])) || (days.test(tokens[1]))) {
        // matched a regex for specified time & UoM.
        specifiedDuration = Number(tokens[1].substr(0,tokens[1].length-1)); // set duration to the digits only
        switch (tokens[1].slice(-1)) {
            case "m":
                specifiedUOM = "minutes";
                break;
            case "h":
                specifiedUOM = "hours";
                break;
            case "d":
                specifiedUOM = "days";
                break;
        }
        tokens.splice(1,1); // remove the specified time /UoM arg from the tokens array        
    }
    
    return {
        uom: specifiedUOM,
        duration: specifiedDuration,
        newTokens: tokens
    }
}

function getOldRoles(tankedMember){
    return Array.from(tankedMember.roles.cache.mapValues(role => role.id).keys());
} 

function removeRoleFromArray(roleArray, roleIdToRemove) {
    if (roleArray == undefined) {
        return [];
    }
    roleArray.forEach((o,i) => {
			if (o === roleIdToRemove) {
				roleArray.splice(i,1);
			}
		});
		return roleArray;
}

async function convertRoleIdArrayToRoleNameArray(rolesToConvert, guildService) {
    retval = [];

    for (n = 0; n< rolesToConvert.length; n++) {
        r = await guildService.getRole(rolesToConvert[n]).catch((e)=>{return {name:"[DELETED-ROLE]"};});
        retval.push(r.name.toString());
    }

    return retval;
}

function getTopFive(stats) {
    var top5 = [];
    stats.sort((a,b) => { return  b.count - a.count }).slice(0,5);
    return top5;
}

function getBotVersion() {
    var pjson = require("../package.json");
    return pjson.version;
}

function convertDataFromDB(data,method) {
	var tmp = {};
	if (method === "cfg") {
		Object.entries(data).forEach(([i,o]) => {
			tmp[i.toString()] = {};
			tmp[i.toString()].serverID = o.serverID.toString();
			tmp[i.toString()].commandPrefix = o.commandPrefix.toString();
			tmp[i.toString()].botMasterRole = o.botMasterRole === null ? null : o.botMasterRole.toString();
            tmp[i.toString()].modUserRole = o.modUserRole === null ? null : o.modUserRole.toString();
			tmp[i.toString()].botUserRole = o.botUserRole === null ? null : o.botUserRole.toString();
            tmp[i.toString()].uncountedLimitRole = o.uncountedLimitRole === null ? null : o.uncountedLimitRole.toString();
			tmp[i.toString()].drunktankRole = o.drunktankRole === null ? null : o.drunktankRole.toString();
            tmp[i.toString()].minorRole = o.minorRole === null ? null : o.minorRole.toString();
            tmp[i.toString()].verifiedRole = o.verifiedRole === null ? null : o.verifiedRole.toString();
			tmp[i.toString()].tankChannel = o.tankChannel === null ? null : o.tankChannel.toString();
            tmp[i.toString()].minorChannel = o.minorChannel === null ? null : o.minorChannel.toString();
			tmp[i.toString()].logChannel = o.logChannel === null ? null : o.logChannel.toString();
			tmp[i.toString()].invitesChannel = o.invitesChannel === null ? null : o.invitesChannel.toString();
			tmp[i.toString()].namesChannel = o.namesChannel === null ? null : o.namesChannel.toString();
            tmp[i.toString()].mentionsLog = o.mentionsLog === null ? null : o.mentionsLog.toString();
			tmp[i.toString()].modlogChannel = o.modlogChannel === null ? null : o.modlogChannel.toString();
			tmp[i.toString()].bypassGMU = o.bypassGMU.split(",");
			tmp[i.toString()].rolesToIgnore = o.rolesToIgnore === null ? null : o.rolesToIgnore.split(",");
			tmp[i.toString()].rolesICannotTank = o.rolesICannotTank === null ? null : o.rolesICannotTank.split(",");
			tmp[i.toString()].tankUOM = o.tankUOM.toString();
			tmp[i.toString()].tankDuration = parseInt(o.tankDuration, 10);
            tmp[i.toString()].verifyAgeBy = parseInt(o.verifyAgeBy, 10);
			tmp[i.toString()].writeMessageToDrunkTank = !!o.writeMessageToDrunkTank;
			tmp[i.toString()].warnAuthorizedUsage = !!o.warnAuthorizedUsage;
			tmp[i.toString()].startServer = !!o.startServer;
		});
	}
	if (method === "tank") {
		Object.entries(data).forEach(([i,o]) => {
			tmp[i.toString()] = {};
			tmp[i.toString()].time_tanked = o.time_tanked;
			tmp[i.toString()].user_tanked = o.user_tanked.toString();
			tmp[i.toString()].tanked_by = o.tanked_by.toString();
			tmp[i.toString()].tank_reason = o.tank_reason;
			tmp[i.toString()].time_to_untank = o.time_to_untank;
			tmp[i.toString()].roles_to_give_back = o.roles_to_give_back.split(",");
			tmp[i.toString()].untanked_by = o.untanked_by === null ? null : o.untanked_by.toString();
			tmp[i.toString()].time_untanked = o.time_untanked === null ? null : o.time_untanked;
			tmp[i.toString()].untanked_reason = o.untanked_reason === null ? null : o.untanked_reason;
		});
	}
    if (method === "minor") {
		Object.entries(data).forEach(([i,o]) => {
			tmp[i.toString()] = {};
			tmp[i.toString()].time = o.time;
			tmp[i.toString()].user = o.user.toString();
			tmp[i.toString()].staff_user = o.staff_user.toString();
			tmp[i.toString()].ban_by = o.ban_by;
			tmp[i.toString()].roles_to_give_back = o.roles_to_give_back.split(",");
		});
	}
	return tmp;
}

exports.fisherYates = fisherYates;
exports.getTopFive = getTopFive;
exports.convertRoleIdArrayToRoleNameArray = convertRoleIdArrayToRoleNameArray;
exports.removeRoleFromArray = removeRoleFromArray;
exports.getOldRoles = getOldRoles;
exports.parseDurationFromTokens = parseDurationFromTokens;
exports.getDateDiffString = getDateDiffString;
exports.getReason = getReason;
exports.validateReason = validateReason;
exports.validateMentions = validateMentions;
exports.tokenize = tokenize;
exports.trimCommand = trimCommand;
exports.trimMsg = trimMsg;
exports.convertDataFromDB = convertDataFromDB;
exports.BOT_VERSION = getBotVersion;