var query = null;
var qResults = null;
var tankees = {};

async function queryDB(getColumns) {
	qResults = await MANAGERS.dbConnectionManager.Query(query,getColumns);
	query = null;
}

/*
Save an individual user tanking event as a new record
*/
async function saveTanking(guildId, userTanked, tankedBy, reason, duration, uom, oldRoles) {
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
			insert: guildId + "_tankees",
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
Save a user record as a newly suspected minor.
*/
async function saveMinor(guildId, minorUserId, staffId, oldRoles) {
    let ts = Date.now();
    let deadline = ts + (CONFIG.servers[guildId].verifyAgeBy * 3600000);
    minor_obj = {
			time: ts,
			user: minorUserId,
			staff_user: staffId,
			ban_by: deadline,
			roles_to_give_back: oldRoles.join(",")
    }
		
	query = {
		insert: guildId + "_ageVerify",
		columns: Object.keys(minor_obj),
		valueHolders: [],
		values: []
	};
	
	Object.keys(minor_obj).forEach((k) => {
		query.valueHolders.push("?");
		query.values.push(minor_obj[k]);
	});
	query.valueHolders = "(" + query.valueHolders.join() + ")";
    queryDB();
}

/*
Update a tanked user record to be untanked
*/
async function saveUntanking(guildId, userIdToUntank, untanker, untankReason) {
		let ts = Date.now();
		
		query = {
			update: guildId + "_tankees",
			sets:  "time_untanked = ?, untanked_by = ?, untanked_reason = ?",
			where: "((time_untanked IS NULL) AND (user_tanked = ?))",
			values: [ts,untanker,untankReason,userIdToUntank]
		};
		queryDB();
}

/*
Remove a suspected minor user record as newly verified
*/
async function removeMinor(guildId, adultMember) {
	query = {
		del: guildId + "_ageVerify",
		where: "user = ?",
		values: [adultMember]
	};
	queryDB();
}

/*
returns a json array of all currently tanked users from guild
function will not filter results unless second arg evaluates to true
function accepts third arg as userId to get only one user -- used instead of getUser()
*/
async function getTankedUsers(guildId, filter, userId) {
    if (arguments.length === 1) {
			filter = false;
		}
		if (arguments.length === 2) {
		  userId = false;
		}
		
		query = {
			select: guildId + "_tankees",
			columns: ["*"],
			where: "?",
			values: [1]
		};
		
		if (filter) {
			if (userId) {
			  query.where = "((user_tanked = ?) AND (time_untanked IS NULL))";
				query.values = [userId];
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
			tankees = HELPERS.helpers.convertDataFromDB(tankees,"tank");
		});
		return tankees;
}

/*
returns a json array of all currently suspected minor users from guild
function will not filter results unless second arg evaluates to true
function accepts third arg as userId to get only one user
*/
async function getMinorUsers(guildId, userId) {
    if (arguments.length === 1) {
		userId = false;
	}
		
	query = {
		select: guildId + "_ageVerify",
		columns: ["*"],
		where: "?",
		values: [1]
	};
	
	if (userId) {
		query.where = "user = ?";
		query.values = [userId];
	}

	await queryDB()
	.then(() => {
		tankees = {}; // no need for a separately named variabled here, so just use what already exists.
		qResults.forEach((e) => {
			tankees[e.user] = e; // unlike tank records, we organize by user Id because we aren't tracking stats on this.
		});
	})
	
	.then(() => {
		tankees = HELPERS.helpers.convertDataFromDB(tankees,"minor");
	});
	return tankees;
}

/*
Add a sip to the sip json 
*/
async function addSip(guildId, sipStr, userId, t) {
    var u = await getSipCountForUser(guildId,userId);		
		// the sipstring was already validated, so it is safe to concat it into the columns.
		// Check for minimum time between sips
		if ((u !== undefined) && (t - u.lastSip < 7000)) { // 7 seconds minimum sounds reasonable between sips
			u.slow = true;
			return u;
		} else {
			if (u !== undefined) {
				u[sipStr]++;
				query = {
					update: guildId + "_sips",
					sets: "lastSip = ?," + sipStr + " = ?",
					where: "(userId = ?)",
					values: [t,(u[sipStr]),userId]
				};
			} else {
				u = {userId: userId};
				u[sipStr] = 1;
				query = {
					insert: guildId + "_sips",
					columns: ["userId","lastSip",sipStr],
					valueHolders: "(?,?,?)",
					values: [userId,t,1]
				};
			}
			await queryDB();
			return u;
		}
}

/*
Return a list of all historical sips
*/
async function getAllSips(guildId) {
		let rData = {structure: [], data: []};
		query = {
			select: guildId + "_sips",
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
async function getSipCountForUser(guildId, userId) {
		query = {
			select: guildId + "_sips",
			columns: ["*"],
			where: "userId = ?",
			values: [userId]
		}
		await queryDB();
		return qResults[0];
}

exports.addSip = addSip;
exports.getAllSips = getAllSips;
exports.getSipCountForUser = getSipCountForUser;
exports.saveTanking = saveTanking;
exports.getTankedUsers = getTankedUsers;
exports.saveUntanking = saveUntanking;
exports.getMinorUsers = getMinorUsers;
exports.saveMinor = saveMinor;
exports.removeMinor = removeMinor;