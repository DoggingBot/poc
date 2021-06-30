const BOT_VERSION = "1.1.0";

var CONFIG;

function injectConfig(myConfig) {
    CONFIG = myConfig;
}
var moment = require('moment');

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
        message.channel.send("Invalid arguments. You must enter a reason. Correct usage: " + CONFIG.commandPrefix + "tank @user reason");
        return false;
    }
    return true;
}

function validateMentions(message, command, prefix) {
    if (message.mentions.users.size == 0) {
        message.channel.send("Invalid arguments. You need to @ the user to drunk tank them. Correct usage: " + prefix + command + " @user reason");
        return false;
    }

    if (message.mentions.users.size > 1) {
        message.channel.send("Invalid arguments. More than one user @'d - only @ the user you are tanking. Correct usage: " + prefix + command + " @user reason");
        return false;
    }

    return true;
}

function tokenize(m) {
    return m.split(" ");
}

function trimCommand(message) {
    let command = message.content.toLowerCase().split(" ")[0];
    command = command.slice(CONFIG.commandPrefix.length);
    return command;
}

function trimMsg(message) {
    let command = message.content.toLowerCase().split(" ")[0];
    msg =  message.content.slice(command.length); 
    return msg;
}

function doesUserHaveRole(userObj, roleId) {
    var retval = false;

    for (n=0;n<userObj.roles.length;n++) {
        if (userObj.roles[n] == roleId) {
            retval = true;
        }
    }
    return retval;
}

function parseDurationFromTokens(tokens) {
    // For finding the possible existence of a specified duration/UoM, we have to set the defaults first found in config. All references to the config defaults must be swapped over to these new local-scope variables.
    var specifiedDuration = CONFIG.tankDuration; // "12"
    var specifiedUOM = CONFIG.tankUOM; // "hours"
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

function getAtString(userId) {
    return "<@"+userId+">";
}

function getOldRoles(tankedMember){
    return Array.from(tankedMember.roles.cache.mapValues(role => role.id).keys());
} 

function removeRoleFromArray(roleArray, roleIdToRemove) {
    for( var i = 0; i < roleArray.length; i++){ 
        if (roleArray[i] === roleIdToRemove) { 
            roleArray.splice(i, 1); 
            return roleArray;
        }
    }
    return roleArray;
}

async function convertRoleIdArrayToRoleNameArray(rolesToConvert, guildService) {
    retval = [];

    for (n = 0; n< rolesToConvert.length; n++) {
        r = await guildService.getRole(rolesToConvert[n]);
        retval.push(r.name.toString());
    }

    return retval;
}

function getTopFive(stats) {
    var top5 = [];
    stats.sort((a,b) => { return  b.count - a.count }).slice(0,5);
    return top5;
}

exports.getTopFive = getTopFive;
exports.convertRoleIdArrayToRoleNameArray = convertRoleIdArrayToRoleNameArray;
exports.removeRoleFromArray = removeRoleFromArray;
exports.getOldRoles = getOldRoles;
exports.getAtString = getAtString;
exports.parseDurationFromTokens = parseDurationFromTokens;
exports.getDateDiffString = getDateDiffString;
exports.getReason = getReason;
exports.validateReason = validateReason;
exports.validateMentions = validateMentions;
exports.tokenize = tokenize;
exports.trimCommand = trimCommand;
exports.trimMsg = trimMsg;
exports.injectConfig = injectConfig;
exports.doesUserHaveRole = doesUserHaveRole;
exports.BOT_VERSION = BOT_VERSION;