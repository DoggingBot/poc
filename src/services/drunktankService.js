var persistenceService = require('./persistenceService');
var guildService = require('./guildService');

var HELPERS = require('../helpers/helpers');
var MESSAGES = require('../helpers/messages');

var CONFIG;

function injectConfig(_cfg, guildSvc) {
    CONFIG = _cfg;
    guildService = guildSvc;
}

/*
tank a user

tankedMember = string userId
authorId = string userId
reason = string
duration = string
uom = string
*/
async function tankUser(userToTankId, authorId, reason, duration, uom) {

    var userToTankObj = await guildService.getMemberForceLoad(userToTankId);
    var authorObj = guildService.getMemberFromCache(authorId);


    console.log("Drunk tanking " + userToTankObj.nickname + " -- initiated by " + authorObj.nickname);
  
    try {
        var rolesToTakeAway = await HELPERS.convertRoleIdArrayToRoleNameArray(userToTankObj.roles, guildService);

        //Set the roles
        await guildService.setRolesForMember(userToTankId, [CONFIG.drunktankRole]);

        //Construct the blue log message
        msg = MESSAGES.log_blue_tank_msg(
            authorObj.nickname, 
            HELPERS.getAtString(userToTankId), 
            userToTankObj.username, 
            userToTankObj.id, 
            reason
        );
        
        //Write the log message to the blue log channel
        await guildService.writeToChannel(CONFIG.logChannel, msg);

        //Save the tanking
        persistenceService.saveTanking(userToTankId, authorObj.nickname, reason, duration, uom, userToTankObj.roles);

        //if enabled, write a notification to the drunk tank channel after 10 seconds
        if (CONFIG.writeMessageToDrunkTank) {
            setTimeout(() => {
                msg = MESSAGES.tank_msg(
                    authorObj.nickname, 
                    HELPERS.getAtString(tankedMember), 
                    reason,  
                    duration, 
                    uom
                );
                guildService.writeToChannel(CONFIG.tankChannel, msg);
            }, 10000);
        }
    
        //return a promise that resolves to true if successful, including the roles we took away
        return Promise.resolve({
            roles: rolesToTakeAway
        });
    }
    catch(error)  {
        var errorMsg = "Failed to handle tanking for user: " + userToTankId + 
        "\r\nDo I have the permissions to manage this user?" +
        "\r\n"+error;

        await guildService.writeToChannel(CONFIG.logChannel, errorMsg);

        return Promise.reject(error);
    }

}

/*
untank a user

untankedMemberId = string userId
authorId = string userId 
untankedMemberJson = our tank record for this user if there is one

Returns the roles we gave them back as a string
*/
async function untankUser(untankedMemberId, authorId, untankedMemberJson) {

    var untankedUserObj = guildService.getMemberForceLoad(untankedMemberId);
    var authorObj = guildService.getMemberFromCache(authorId);

    //make sure we don't accidently give back the 2drunk2party role
    var rolesToGiveBack = [];
    if (untankedMemberJson != undefined) {
        rolesToGiveBack = HELPERS.removeRoleFromArray(untankedMemberJson.roles_to_give_back, CONFIG.drunktankRole);
    }
    
    //Convert the role ID's to strings for readable output
    var rolesToGiveBackStr = await HELPERS.convertRoleIdArrayToRoleNameArray(rolesToGiveBack, guildService);

    //Build a string that describes how long this person was tanked
    let ts = Date.now();
    var datediff = HELPERS.getDateDiffString(ts, untankedMemberJson.time_tanked);

    try {
        await guildService.setRolesForMember(untankedMemberId, rolesToGiveBack);

        //Construct the blue log message
        msg = MESSAGES.log_blue_untank_msg(
            authorObj.nickname,
            HELPERS.getAtString(untankedMemberId), 
            untankedUserObj.username, 
            untankedUserObj.id, 
            datediff
        );

        //Write the log message to the blue log channel
        await guildService.writeToChannel(CONFIG.logChannel, msg);

        //Save the untanking
        persistenceService.saveUntanking(untankedMemberId);

        //Return a resolved promise with the roles we gave them back
        return Promise.resolve({
            success: true,
            roles: rolesToGiveBackStr
        });

    } catch(error)  {
        var errorMsg = "Failed to handle tanking for user: " + untankedMemberId + 
        "\r\nDo I have the permissions to manage this user?" +
        "\r\n"+error;

        await guildService.writeToChannel(CONFIG.logChannel, errorMsg);

        return Promise.reject(error);
    };
}

exports.injectConfig  = injectConfig;
exports.tankUser = tankUser;
exports.untankUser = untankUser;