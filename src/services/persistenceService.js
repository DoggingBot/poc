var fs = require('fs');
var CONFIG;

function injectConfig(myConfig) {
    CONFIG = myConfig;
}

/*
Save an individual user tanking event
*/
function saveTanking(userToTankId, authorNickname, reason, duration, uom, oldRoles) {
    let ts = Date.now();
    let untank_time = 0;

    switch (uom) {
        case "days": 
            untank_time = ts + (duration*24*60*60*1000)
            break;
        case "hours": 
            untank_time = ts + (duration*60*60*1000)
            break;
        case "minutes":
            untank_time = ts + (duration*60*1000)
            break;
    }

    tankee_obj = {
        user_tanked: userToTankId,
        tanked_by: authorNickname,
        reason: reason, 
        time_tanked: ts,
        time_to_untank: untank_time,
        role_to_remove: CONFIG.drunktankRole,
        roles_to_give_back: oldRoles,
        archive: false
    }

    if (!fs.existsSync(CONFIG.json_path)) {
        fs.writeFileSync(CONFIG.json_path, JSON.stringify([tankee_obj]));
    }
    else {
        var data = fs.readFileSync(CONFIG.json_path);
        var json = JSON.parse(data);
        json.push(tankee_obj);
        fs.writeFileSync(CONFIG.json_path, JSON.stringify(json));
    }
}

/*
Remove all active tanking records for an individual user
*/
function saveUntanking(userIdToUntank) {
    data = fs.readFileSync(CONFIG.json_path);
    var json = JSON.parse(data)
    var user;
    for (n=0;n<json.length; n++) {
        if (json[n].archive) {
            continue;   
        }
        if (json[n].user_tanked == userIdToUntank) {
            json[n].archive = true;
            user = json[n];
        }
    }

    fs.writeFileSync(CONFIG.json_path, JSON.stringify(json))

    return user;
}

/*
returns a json array of all currently tanked users
*/
function getTankedUsers() {
    if (!fs.existsSync(CONFIG.json_path)) {
        return [];
    }
    var data = fs.readFileSync(CONFIG.json_path);
    var json = JSON.parse(data)
    return json.filter(obj => obj.archive == false);
}

/*
returns a json representation of a tanked user if there is one
*/
function getUser(userIdToGet) {
    data = fs.readFileSync(CONFIG.json_path);
    var json = JSON.parse(data)
    user = json.find(obj => obj.archive == false && obj.user_tanked == userIdToGet);
    return user;
}

exports.getUser = getUser;
exports.saveTanking = saveTanking;
exports.getTankedUsers = getTankedUsers;
exports.saveUntanking = saveUntanking;
exports.injectConfig = injectConfig;