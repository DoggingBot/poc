var dbManager = require('../managers/dbConnectionManager.js');
var guildService = require('./guildService');

var query = null;
var qResults = null;

async function queryDB(getColumns) {
	qResults = await dbManager.Query(query,getColumns);
	query = null;
}

async function getInvites(guild) {
	query = {
		select: guild + "_invites",
		columns: ["*"],
		where: "?",
		values: [1]
	};
	await queryDB();
	if (!qResults.length) {
		// no invites... odd.
		return false;
	}
	let invites = {};
	qResults.forEach((o,i) => {
		invites[o.code] = {inviter: o.inviter, uses: o.uses, dummies: o.dummies, deleted: o.deleted};
	});
	query = {
		select: guild + "_invite_uses",
		columns: ["*"],
		where: "?",
		values: [1]
	};
	await queryDB();
	if (!qResults.length) {
		// no invites were used. This can happen when the system is first used and nobody has joined since.
		// just return the invites object now.
		return invites;
	}
	let uses = {};
	qResults.forEach((o,i) => {
		if (uses[o.code] === undefined) {
			uses[o.code] = {};
		}
		if (uses[o.code][o.userId] === undefined) {
			uses[o.code][o.userId] = [];
		}
		uses[o.code][o.userId].push(o.joined);
	});
	
	// Do some lag checking between known uses and listed uses of the two tables,
	// all while moving the known users into invites.CODE.uses.
	Object.entries(uses).forEach(([i,o]) =>{
		var ulist = 0;
		Object.entries(o).forEach(([u,t]) => {
			ulist += t.length;
		});
		if (invites[i].uses - invites[i].dummies !== ulist) {
			guildService.writeToChannel('logChannel', 
			"There was a disparity between the userlist and the uses count in the DB for invite code **" + i + "**." +
			"\r\nUses count: " + invites[i].uses + " - Users listed: " + (ulist === 1 ? "1 use " : ulist + " uses ") + "and " + (invites[i].dummies === 1 ? "1 dummy" : invites[i].dummies + " dummies")
			);
		}
		invites[i].uses = o;
	});
	return invites;
}

async function updateInvite(guild, invite, remove) {
  remove = remove === undefined ? false : remove;
	
	query = {
		select: guild + "_invites",
		columns: ["*"],
		where: "code = ?",
		values: [invite.code]
	};
	await queryDB();
	
	// save results of the select statement before we run the update
	let dbinvites = JSON.parse(JSON.stringify(qResults));
	
	// Make sure we got the invite properly
	if (!qResults.length) {
		// we got nothing, which is some kind of serious error or the record may have been manually deleted.
		return await guildService.writeToChannel('logChannel', 
			"<@&" + CONFIG.servers[guild].botMasterRole + "> The inviteService of the bot failed to retrieve an invite from the DB when it should have existed. Did someone delete the invite record manually from the DB?"
		);
	} else {
		query = {
			update: guild + "_invites",
			sets: null,
			where: "code = ?",
			values: null
		};
		// did a use happen, or was it deleted?
		if (remove) {
			// the uses are the same, which is our way of saying its being deleted.
			query.sets = "deleted = ?";
			query.values = [true,invite.code];
		} else {
			// just to be safe, invite.uses should be only greater than the db record by 1.
			// If it isn't, we will update it, but notify the staff in their logchannel.
			if (invite.uses === (dbinvites[0].uses + 1)) {
				// it only incremented by one, quickly update it.
				query.sets = "uses = ?";
				query.values = [invite.uses,invite.code];
			} else {
				await guildService.writeToChannel('logChannel', 
					"The invite " + invite.code + " saw more than one use between its last update (from " + dbinvites[0].uses + " to " + invite.uses + "). Perhaps the bot got flooded before it had a chance to properly handle newly added users."
				);
				query.sets = "uses = ?";
				query.values = [invite.uses,invite.code];
			}
		}
		
		await queryDB().then(() =>{
			if (!dbinvites[0].deleted) {
			  dbinvites[0].uses = invite.uses;
			}
		});
	}
	// return back the updated invite object from the DB.
	return dbinvites[0];
}

async function createInvite(guild, invite) {
	query = {
		insert: guild + "_invites",
		columns: ["code","inviter","uses","dummies","deleted"],
		valueHolders: "(?,?,?,?,?)",
		values: [invite.code, invite.inviter.id, 0, 0, false]
	};
	await queryDB();
	return true;
}

async function addInviteUse(member, invite) {
	query = {
		insert: member.guild.id + "_invite_uses",
		columns: ["joined","code","userId"],
		valueHolders: "(?,?,?)",
		values: [member.joinedTimestamp, invite.code, member.id]
	}
	await queryDB();
	return await updateInvite(member.guild.id, invite);
}

async function getGuildInvites(guildOBJ) {
	let invites = [];
	// First get the vanityURL if it exists
	if (guildOBJ.vanityURLCode !== null) {
		if (guildOBJ.vanityURLUses === null) {
			invites.push({
				code: guildOBJ.vanityURLCode,
				inviter: "VANITY_URL",
				uses: 0,
				deleted: false
			});
		} else {
			invites.push({
				code: guildOBJ.vanityURLCode,
				inviter: "VANITY_URL",
				uses: guildOBJ.vanityURLUses,
				deleted: false
			});
		}
	}
	// get all the invites of the guild and put them into the invites object
	await guildOBJ.fetchInvites().then((inv) => {
		inv.forEach((i,k)=>{
			if (i.code !== guildOBJ.vanityURLCode) {
				// Currently unknown if Vanity is included. Can't hurt to leave this here.
				invites.push({
					code: i.code,
					inviter: i.inviter.id,
					uses: i.uses,
					deleted: false
				});
			}
		});
	});
	return invites;
}

async function storeInvites(guildOBJ) {
	let dbInvites = await getInvites(guildOBJ.id);
	let ti = await getGuildInvites(guildOBJ);
	let invites = [];
	if (dbInvites) {
		// only perform loop if we had any invites in the db
		ti.forEach((i,k) => {
			if (dbInvites[i.code] === undefined) {
				// invite not in db
				invites.push(ti[k]);
			}
		});
	} else {
		invites = ti;
	}
	
	if (invites.length) {
		// only do something if we had an invite to save
		query = {
			insert: guildOBJ.id + "_invites",
			columns: ["code","inviter","uses","dummies","deleted"],
			valueHolders: "",
			values: []
		};
		let query_uses = [];
		// set up the query for multiple inserts, and prep the dummy uses for each invite
		invites.forEach((i,k)=>{
			query.valueHolders += " (?,?,?,?,?)";
			query.valueHolders += (invites.length - 1 > k ? ", " : "");
			// code initially discovered has dummies set to its current uses
			query.values.push(i.code,i.inviter,i.uses,i.uses,i.deleted);
			query_uses.push(i.code,i.uses);
		});
		
		// Insert the invites
		await queryDB();
		
		// grab the DB again to verify the now exist
		dbInvites = await getInvites(guildOBJ.id);
		let invs = {saved:0, lost:0, err: false};
		invites.forEach((i,k) => {
			if (dbInvites[i.code] !== undefined) {
				invs.saved++;
			} else {
				invs.lost++;
				invs.err = true;
			}
		});
		return invs;
	} else {
		return {saved: 0, err: false};
	}
}

exports.getInvites = getInvites;
exports.updateInvite = updateInvite;
exports.createInvite = createInvite;
exports.addInviteUse = addInviteUse;
exports.storeInvites = storeInvites;
exports.getGuildInvites = getGuildInvites;