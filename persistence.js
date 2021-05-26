var fs = require('fs');
var config ;

function injectConfig(myConfig) {
    config = myConfig;
}

function saveTanking(author, guild, userToTank, reason, oldRoles, duration, uom) {
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
        guild_id: guild.id,
        user_tanked: userToTank,
        tanked_by: author,
        reason: reason, 
        time_tanked: ts,
        time_to_untank: untank_time,
        role_to_remove: config.drunktankRole,
        roles_to_give_back: oldRoles,
        archive: false
    }

    if (!fs.existsSync(config.json_path)) {
        fs.writeFileSync(config.json_path, JSON.stringify([tankee_obj]));
    }
    else {
        var data = fs.readFileSync(config.json_path);
        var json = JSON.parse(data);
        json.push(tankee_obj);
        fs.writeFileSync(config.json_path, JSON.stringify(json));
    }
}

function getTankedUsers() {
    if (!fs.existsSync(config.json_path)) {
        return [];
    }
    var data = fs.readFileSync(config.json_path);
    var json = JSON.parse(data)
    return json 
}

function untankUser(userToUntank) {
    data = fs.readFileSync(config.json_path);
    var json = JSON.parse(data)
    var user;
    for (n=0;n<json.length; n++) {
        if (json[n].archive) {
            continue;   
        }
        if (json[n].user_tanked == userToUntank) {
            json[n].archive = true;
            user = json[n];
        }
    }

    fs.writeFileSync(config.json_path, JSON.stringify(json))

    return user;
}

function getUser(userToGet) {
    data = fs.readFileSync(config.json_path);
    var json = JSON.parse(data)
    var user;
    for (n=0;n<json.length; n++) {
        if (json[n].archive) {
            continue;   
        }

        if (json[n].user_tanked == userToGet) {
            json[n].archive = true;
            user = json[n];
        }
    }
    return user;
}

exports.getUser = getUser;
exports.saveTanking = saveTanking;
exports.getTankedUsers = getTankedUsers;
exports.untankUser = untankUser;
exports.injectConfig = injectConfig;