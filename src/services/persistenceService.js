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
        archive: false,
        historical_tank: false
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
Update a tanked user to say they've left (thus removing them from the checktank)
*/
function saveUserLeaving(userIdThatLeft) {
    data = fs.readFileSync(CONFIG.json_path);
    var json = JSON.parse(data);

    for (n=0;n<json.length; n++) {
        if (json[n].archive) {
            continue;   
        }

        //user matches and is a historical tank
        if (json[n].user_tanked == userIdThatLeft) {

            //mark this user as being in the tank historically
            json[n].archive = true;
            json[n].historical_tank = true;
        }
    }

    fs.writeFileSync(CONFIG.json_path, JSON.stringify(json))
}

/*
Update a newly joined user to say they have rejoined (thus including them in checktank again)
*/
function saveUserJoining(userIdThatJoined) {
    data = fs.readFileSync(CONFIG.json_path);
    var json = JSON.parse(data);
    
    for (n=0;n<json.length; n++) {
        if (!json[n].historical_tank) {
            continue;   
        }

        //user matches and is a historical tank
        if (json[n].user_tanked == userIdThatJoined) {
            //unarchive the first one & break
            json[n].archive = false;
            json[n].historical_tank = false;

            break;
        }
    }

    fs.writeFileSync(CONFIG.json_path, JSON.stringify(json))
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
returns a json array of all full tank history
*/
function getTankHistory() {
    if (!fs.existsSync(CONFIG.json_path)) {
        return [];
    }
    var data = fs.readFileSync(CONFIG.json_path);
    var json = JSON.parse(data)
    return json;
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

/*
returns a json representation of a tanked user if there is one
checks historical records too to see if theyve left whilst tanked
*/
function getUserHistorical(userIdToGet) {
    data = fs.readFileSync(CONFIG.json_path);
    var json = JSON.parse(data)
    user = json.find(obj => 
        obj.archive == true 
        && obj.historical_tank == true
        && obj.user_tanked == userIdToGet
    );

    return user;
}

/*
Add a sip to the sip json 
*/
function addSip(sipStr, userID) {
    var obj = getSipCountForUser(sipStr, userID);
    if (obj == undefined) {
        obj = {
            userID: userID,
            count: "1",
            sipStr: sipStr
        }
    } else {
        obj.count++;
    }

    if (!fs.existsSync(CONFIG.countedJsonPath)) {
        fs.writeFileSync(CONFIG.countedJsonPath, JSON.stringify([obj]));
    } else {
        var data = fs.readFileSync(CONFIG.countedJsonPath);
        var json = JSON.parse(data);

        var toAdd=true;
        for (n=0;n<json.length; n++) {
            x = json[n];
            if (x.userID == obj.userID && x.sipStr == obj.sipStr) {
                x.count = obj.count;
                toAdd = false;
            }
        }

        if (toAdd) {
            json.push(obj);
        }
        
        fs.writeFileSync(CONFIG.countedJsonPath, JSON.stringify(json));
    }
    return obj;
}

/*
Return a list of all historical sips
*/
function getAllSips() {
    var data = fs.readFileSync(CONFIG.countedJsonPath);
    var json = JSON.parse(data)
    return json;
}

/*
Return the sip count for an individual user
*/
function getSipCountForUser(sipStr, userID) {
    if (!fs.existsSync(CONFIG.countedJsonPath)) {
        return {
            userID: userID,
            count: "0",
            sipStr: sipStr
        }
    }
    data = fs.readFileSync(CONFIG.countedJsonPath);
    var json = JSON.parse(data)
    user = json.find(obj => obj.userID == userID && obj.sipStr == sipStr);
    return user;
}

exports.addSip = addSip;
exports.getAllSips = getAllSips;
exports.getSipCountForUser = getSipCountForUser;
exports.getUser = getUser;
exports.saveTanking = saveTanking;
exports.getTankedUsers = getTankedUsers;
exports.saveUntanking = saveUntanking;
exports.injectConfig = injectConfig;
exports.getTankHistory = getTankHistory;
exports.getUserHistorical = getUserHistorical;
exports.saveUserJoining = saveUserJoining;
exports.saveUserLeaving = saveUserLeaving;