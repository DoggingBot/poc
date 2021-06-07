var persistenceService = require('./persistenceService');
var guildService = require('./guildService');

const HELPERS = require('../helpers/helpers');

var CONFIG;

function injectConfig(myConfig) {
    CONFIG = myConfig;
}

async function syncTank() {
    refreshedRoleObj = await guildService.getRole(CONFIG.drunktankRole);
    var tankees = persistenceService.getTankedUsers();
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
    refreshedRoleObj.members.forEach( (userId) => {
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

    await toSaveTank.forEach((x)=> {
        persistenceService.saveTanking(x, "Unknown", "Added by synctank command", CONFIG.tankDuration, CONFIG.tankDuration, []);
    });

    await toSaveUntank.forEach((x)=> {
        persistenceService.saveUntanking(x);
    });

    return {
        untanked: toSaveTank.length,
        tanked: toSaveUntank.length
    }
}

exports.syncTank = syncTank;
exports.injectConfig = injectConfig;
