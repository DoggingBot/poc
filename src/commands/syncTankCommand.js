
var guildService = require('../services/guildService');
var persistenceSrvice = require('../services/drunktankService');

const HELPERS = require('../helpers/helpers');

var CONFIG;
function injectConfig(_cfg, guildSvc) {
    CONFIG = _cfg;
    guildService = guildSvc;
}

async function handle(message) {
    msg = HELPERS.trimMsg(message);
    refreshedRoleObj = await guildService.getRole(CONFIG.drunktankRole);
    var tankees = persistenceSrvice.getTankedUsers();
    var tankedDict = {};

    for (n=0;n<tankees.length; n++) {
        var obj = tankees[n];
        if (obj.archive) {
            continue;   
        }
        tankedDict[obj.user_tanked] = obj;
    }

    var toSaveTank = [];
    var usersWithRoleDict = {};
    refreshedRoleObj.forEach( (userId) => {
        var dictKey = userId;

        if (tankedDict[dictKey] == undefined) {
            //we need to add this user to the tank json.
            toSaveTank.push(dictKey);
        }
        usersWithRoleDict[dictKey] = dictKey;
    });

    toSaveUntank = [];
    for (n=0;n<tankees.length; n++) {
        var obj = tankees[n];
        if (obj.archive) {
            continue;   
        }
        if (usersWithRoleDict[obj.user_tanked] == undefined) {
            //this user has had the role removed, untank here
            toSaveUntank.push(obj.user_tanked);
        }
    }

    toSaveTank.forEach((x)=> {
        persistenceSrvice.saveTanking(x, "Unknown", "Added by synctank command", config.tankDuration, config.tankDuration, []);
    });

    toSaveUntank.forEach((x)=> {
        persistenceSrvice.untankUser(x);
    });

    message.channel.send("TankSync complete. " + toSaveTank.length + " entries added to the tank log, " + toSaveUntank.length + " removed.");
}

exports.handle = handle;
exports.injectConfig = injectConfig;