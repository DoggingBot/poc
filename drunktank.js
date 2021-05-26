//This JS file should contain tank/untank functions that are decoupled from the way the command was issues
// IE it doesn't matter to this function if it came from a command or if it was automated.

var CONFIG;
var PERSISTENCE;
var MESSAGING;
var HELPERS;

function injectDependencies(_cfg, _persistence, _messaging, _helpers) {
    CONFIG = _cfg;
    PERSISTENCE = _persistence;
    MESSAGING = _messaging;
    HELPERS = _helpers;
}


function getOldRoles(tankedMember){
    return Array.from(tankedMember.roles.cache.mapValues(role => role.id).keys());
} 

/*
guild = Guild
tankedMember = GuildMember
authorStr = string
reason = string
duration = string
uom = string
*/
async function tankUser(guild, tankedMember, authorStr, reason, duration, uom) {
    var oldRoles = getOldRoles(tankedMember);

    console.log("Drunk tanking " + tankedMember + " -- initiated by " + authorStr);
  
    try {
        await tankedMember.roles.set([CONFIG.drunktankRole], "Drunk tanked by " + authorStr);
        msg = MESSAGING.log_blue_tank_msg(authorStr, HELPERS.getAtString(tankedMember), tankedMember.user.username, tankedMember.user.id, reason);
        await MESSAGING.write_to_channel(guild, CONFIG.logChannel, msg);
        await PERSISTENCE.saveTanking(authorStr, guild, tankedMember.user.id, reason, oldRoles, duration, uom);
    }
    catch(error)  {
        var errorMsg = "Failed to remove roles for " + tankedMember + 
        "\r\nDo I have the permissions to manage this user?" +
        "\r\n"+error;

        return MESSAGING.write_to_channel(guild, CONFIG.logChannel, errorMsg);
    }

    if (CONFIG.writeMessageToDrunkTank) {
        setTimeout(() => {
            msg = MESSAGING.tank_msg(authorStr, HELPERS.getAtString(tankedMember), reason,  duration, uom);
            MESSAGING.write_to_channel(guild, CONFIG.tankChannel, msg);
        }, 10000);
    }
}

/*
guild = Guild
untankedmember = GuildMember
untankedMemberJson = our tank record for this user if there is one
authorStr = string

Returns the roles we gave them back as a string
*/
async function untankUser(guild, untankedMember, untankedMemberJson, authorStr) {
    //make sure we don't accidently give back the same role
    //this is kinda lazy tbh should really do this upon tanking
    var rolesToGiveBack = [];
    if (untankedMemberJson != undefined) {
        for( var i = 0; i < untankedMemberJson.roles_to_give_back.length; i++){ 
            if (untankedMemberJson.roles_to_give_back[i] === untankedMemberJson.role_to_remove) { 
                untankedMemberJson.roles_to_give_back.splice(i, 1); 
            }
        }
    }
    rolesToGiveBack = untankedMemberJson.roles_to_give_back;

    var rolesToGiveBackStr = [];
    await rolesToGiveBack.forEach(async (roleId)=> {
        r = await guild.roles.fetch(roleId);
        rolesToGiveBackStr.push(r.name.replace("@","")); //lets not @ anyone
    }) ;

    try {
        await untankedMember.roles.set(rolesToGiveBack);
        let ts = Date.now();
        var datediff = HELPERS.getDateDiffString(ts, untankedMemberJson.time_tanked);
        msg = MESSAGING.log_blue_untank_msg(authorStr, HELPERS.getAtString(untankedMember), untankedMember.user.username, untankedMember.user.id, reason, datediff);
        await MESSAGING.write_to_channel(guild, CONFIG.logChannel, msg);
        await PERSISTENCE.untankUser(untankedMember.user.id);

        return Promise.resolve(rolesToGiveBackStr);
    } catch(error)  {
        var errorMsg = "Failed to remove roles for " + untankedMember + 
        "\r\nDo I have the permissions to manage this user?" +
        "\r\n"+error;

        return MESSAGING.write_to_channel(guild, CONFIG.logChannel, errorMsg);
    };
}

exports.injectDependencies  = injectDependencies;
exports.tankUser = tankUser;
exports.untankUser = untankUser;