const HELPERS = require('../helpers/helpers');
//instantiate our db connection manager
var dbManager = require('../managers/dbConnectionManager.js');

var query = null;
var qResults = null;
var tankees = {};
var sips = {};

/* DEPRECATED AND REMOVED; CONFIG lives in global namespace of main.js
var CONFIG;
function injectConfig(_cfg) {
    CONFIG = _cfg;
}
*/

async function queryDB(getColumns) {
	qResults = await dbManager.Query(query,getColumns);
	query = null;
}

/*
Save an individual user tanking event as a new record
*/
async function saveTanking(guildID, userTanked, tankedBy, tankReason, duration, uom, oldRoles) {
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
        time_tanked: ts,
				user_tanked: userTanked,
        tanked_by: tankedBy,
        tank_reason: reason,
        time_to_untank: untank_time,
        roles_to_give_back: oldRoles.join(","),
        time_untanked: null,
				untanked_by: null,
				untanked_reason: null
    }
		
		query = {
			insert: guildID + "_tankees",
			columns: Object.keys(tankee_obj),
			valueHolders: [],
			values: []
		};
		
		Object.keys(tankee_obj).forEach((k) => {
			query.valueHolders.push("?");
			query.values.push(tankee_obj[k]);
		});
		query.valueHolders = "(" + query.valueHolders.join() + ")";
    queryDB();
}

/*
Update a tanked user record to be untanked
*/
async function saveUntanking(guildID, userIdToUntank, untanker, untankReason) {
		let ts = Date.now();
		
		query = {
			update: guildID + "_tankees",
			sets:  "time_untanked = ?, untanked_by = ?, untanked_reason = ?",
			where: "((time_untanked IS NULL) AND (user_tanked = ?))",
			values: [ts,untanker,untankReason,userIdToUntank]
		};
		queryDB();
}

/*
Update a tanked user to say they've left (thus removing them from the checktank)
 DEPRECATED; users stay in tank but are not mentioned in checktank command if they are not in the server
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
 DEPRECATED; users stay in tank but are not mentioned in checktank command if they are not in the server
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

            fs.writeFileSync(CONFIG.json_path, JSON.stringify(json))
            break;
        }
    }
}

/*
returns a json array of all currently tanked users from guild
function will not filter results unless second arg evaluates to true
function accepts third arg as userID to get only one user -- used instead of getUser()
*/
async function getTankedUsers(guild, filter, user) {
    if (arguments.length === 1) {
			filter = false;
		}
		if (arguments.length === 2) {
		  user = false;
		}
		
		query = {
			select: guild + "_tankees",
			columns: ["*"],
			where: "?",
			values: [1]
		};
		
		if (filter) {
			if (user) {
			  query.where = "((user_tanked = ?) AND (time_untanked IS NULL))";
				query.values = [user];
			} else {
				query.where = "time_untanked IS NULL";
				query.values = [];
			}
		}
		await queryDB()
		.then(() => {
			tankees = {};
		  qResults.forEach((e) => {
				tankees[e.time_tanked] = e;
			});
		})
		
		.then(() => {
			tankees = HELPERS.convertDataFromDB(tankees,"tank");
		});
		return tankees;
}

/*
returns a json array of all full tank history
DEPRECATED; filtration of tanked vs all is now handled by getTankedUsers()
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
DEPRECATED; uses getTankedUsers(guildID, true, UserID)
*/
function getUser(guild, userIdToGet) {
    data = fs.readFileSync(CONFIG.json_path);
    var json = JSON.parse(data)
    user = json.find(obj => obj.archive == false && obj.user_tanked == userIdToGet);
    return user;
}

/*
returns a json representation of a tanked user if there is one
checks historical records too to see if theyve left whilst tanked
DEPRECATED; getTankedUsers() now returns this data.
calling guildService.guild.member(id) verifies if the user is still in the server or not, and check if the user has not been untanked by untanked_time === null.
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
async function addSip(guild, sipStr, userID, t) {
    var u = await getSipCountForUser(guild,userID)		
		// the sipstring was already validated, so it is safe to concat it into the columns.
		// Check for minimum time between sips
		if ((u !== undefined) && (t - u.lastSip < 7000)) { // 7 seconds minimum sounds reasonable between sips
			u.slow = true;
			console.log(u);
			return u;
		} else {
			if (u !== undefined) {
				u[sipStr]++;
				query = {
					update: guild + "_sips",
					sets: "lastSip = ?," + sipStr + " = ?",
					where: "(userId = ?)",
					values: [t,(u[sipStr]),userID]
				};
			} else {
				u = {userId: userID};
				u[sipStr] = 1;
				query = {
					insert: guild + "_sips",
					columns: ["userId","lastSip",sipStr],
					valueHolders: "(?,?,?)",
					values: [userID,t,1]
				};
			}
			await queryDB();
			return u;
		}
}

/*
Return a list of all historical sips
*/
async function getAllSips(guild) {
		let rData = {structure: [], data: []};
		query = {
			select: guild + "_sips",
			columns: ["*"],
			where: "?",
			values: [1]
		};
		await queryDB(true)
		
		.then(() => {
			rData.structure = qResults[1];
			qResults[0].forEach((e) => {
				rData.data.push(e);
			});
		});
		return rData;
}

/*
Return the sip count for an individual user
*/
async function getSipCountForUser(guild, userID) {
		query = {
			select: guild + "_sips",
			columns: ["*"],
			where: "userId = ?",
			values: [userID]
		}
		await queryDB();
		return qResults[0];
}

exports.addSip = addSip;
exports.getAllSips = getAllSips;
exports.getSipCountForUser = getSipCountForUser;
//exports.getUser = getUser; //DEPRECATED
exports.saveTanking = saveTanking;
exports.getTankedUsers = getTankedUsers;
exports.saveUntanking = saveUntanking;
//exports.injectConfig = injectConfig; //DEPRECATED AND REMOVED
//exports.getTankHistory = getTankHistory; //DEPRECATED
//exports.getUserHistorical = getUserHistorical; DEPRECATED
//exports.saveUserJoining = saveUserJoining; //DEPRECATED
//exports.saveUserLeaving = saveUserLeaving; //DEPRECATED