/*
Handle member joining
we want to check if they have an outstanding tanking, and resume it.
Takes over Discord Role Persistence due to database logging.
*/
async function handle(newMember) {
	// First, handle the invite check.
	let db_invites = await SERVICES.inviteService.getInvites(newMember.guild.id);
    if (!Object.keys(db_invites).length) {
		// We don't have any invites saved!
		return await SERVICES.guildService.writeToChannel('logChannel',
			"<@&" + CONFIG.servers[newMember.guild.id].botMasterRole + "> " +
		  "You need to fill the invites table in the database with your invites!" +
			"\r\nRun the command `" + CONFIG.servers[newMember.guild.id].commandPrefix + "config getinvites`"
		);
	}
	let g_invites = await SERVICES.inviteService.getGuildInvites(newMember.guild);
	let invite = null;
	let inv = "VANITY_URL";
	async function findInvite() {
		await g_invites.forEach((i,k)=>{
			if (i.inviter === inv) {
				inv = i;
			}
			let adjusted_uses = 0;
			if (typeof db_invites[i.code].uses === "object") {
				Object.entries(db_invites[i.code].uses).forEach(([u,t]) => {
					adjusted_uses += t.length;
				});
				adjusted_uses += db_invites[i.code].dummies;
			} else {
				adjusted_uses = db_invites[i.code].uses;
			}
			if ( adjusted_uses === (i.uses - 1)) {
				// Found the code that was used by this joining user.
				invite = i;
			} 
		});
	}
	var error_break = false;
	await findInvite().catch(async (e) => {
		// Happens when an invite code is not in the db records.
		// Tell the invitesService to store any new invites to the db, then rerun the function (only problem is we will experience another exception we cannot handle or rerun if we encounter an issue in saving the new invites).
		let msg = "";
		let invs = await SERVICES.inviteService.storeInvites(newMember.guild);
		if (!invs.err) {
			msg += invs.saved + " Invite" + (invs.saved === 1 ? " has " : "s have ") + "been stored in the database to correct an error.";
		} else {
			msg += "An error was encountered during the storage of invites. " + invs.saved + " were saved and " + invs.lost + " were not saved. Expect another error to occur until the remaining invites are stored successfully.";
		}
		console.log(msg);
		invite = null;
		inv = "VANITY_URL";
		await findInvite().catch((e) => {
			// If an invite code failed to be saved to the db, the error will already be logged, just let the code blow up to prevent any improper updates.
			error_break = true;
		});	
	});
	
	// Skip this if we ran into an invite error, so rolePersistence can still be done regardless of an error.
	if (!error_break) {
		if (invite === null) {
			invite = inv;
		}
		// send join message
		await SERVICES.guildService.writeToChannel("invitesChannel", HELPERS.messages.user_join_msg(newMember, invite));
		// update the invite and add a usage
		await SERVICES.inviteService.addInviteUse(newMember, invite);
	}

	// Now, handle drunktankRole/minorRole persistence
	// Suspected Minors first
	var user = await SERVICES.persistenceService.getMinorUsers(newMember.guild.id, newMember.id);
	let isSuspected = false;
	Object.entries(user).forEach((id,r) => {
		if (id === newMember.id) {
			// This user is a suspected minor.
			isSuspected = r;
		}
	});
	if (isSuspected) {
		return await SERVICES.guildService.setRolesForMember(newMember.id, [CONFIG.servers[newMember.guild.id].minorRole]);
	}

	// Now tanked users -- returned out if they were suspected of being a minor (PRIORITY).
	var user = await SERVICES.persistenceService.getTankedUsers(newMember.guild.id, true, newMember.id);
	let isTanked = false;
	Object.entries(user).forEach(([t,r]) => {
		if (r.user_tanked === newMember.id) {
			// This user was in the tank. Check if their time is up.
			isTanked = r;
		}
	});
	if (isTanked) {
		if (Date.now() >= isTanked.time_to_untank) {
			// Their time is up, call untank command.
			let botMember = await SERVICES.guildService.getMemberForceLoad(newMember.client.id);
			return await SERVICES.drunkTankService.untankUser(newMember.guild.id, newMember, botMember, isTanked, "Time served");
		} else {
			return await SERVICES.guildService.setRolesForMember(newMember.id, [CONFIG.servers[newMember.guild.id].drunktankRole]);
		}
	}
}

exports.handle = handle;