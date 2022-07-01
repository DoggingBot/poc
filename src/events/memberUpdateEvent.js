/*
Handle member changing
this fires for loads of stuff, so filter what we want to look for
// Looking for role changes and name changes only.
*/

async function handle(oldMember, newMember, event) {
	var namechange = false;
	var change = {o:"",n:""};
	var rolechange = false;
	
	// check if event fired from userUpdate or guildMemberUpdate
	if (event === "userUpdate") {
		// check only their username tag. Too many things fire for this.
		if (oldMember.tag !== newMember.tag) {
			// Actual Username/tag changed
			namechange = "Username Altered\r\n";
			change.o = oldMember.tag;
			change.n = newMember.tag;
		}
	} else if (event === "guildMemberUpdate") {
		if (oldMember.nickname !== newMember.nickname) {
			// Nickname set, updated, or removed.
			if (oldMember.nickname === null) {
				namechange = "Nickname Added\r\n";
				change.o = "";
				change.n = newMember.nickname;
			} else if (newMember.nickname === null) {
				namechange = "Nickname Removed\r\n";
				change.o = oldMember.nickname;
				change.n = "";
			} else {
				namechange = "Nickname Changed\r\n";
				change.o = oldMember.nickname;
				change.n = newMember.nickname;
			}
		}
	}
	// Was there a name change?
	if (namechange) {
		return SERVICES.guildService.writeToChannel('namesChannel',HELPERS.messages.user_name_change_msg(oldMember, namechange, change));
	}
	
	// Get back into guildMemberUpdate so we don't error out with userUpdate looking for a guild
	if (event === "guildMemberUpdate") {
		// Check role changes
		var oldRoles = oldMember._roles;
		var newRoles = newMember._roles;
		//check if the roles have changed
		if (JSON.stringify(oldRoles) === JSON.stringify(newRoles)) {
				//HELPERS.logger.log("Handled event with no role changes");
				return;
		}
		
		// Identify the role.
		var role = null;
		oldRoles.forEach((r,i) => {
			if (newRoles.indexOf(r) === -1) {
				role = r;
			}
		});
		if (role === null) {
			newRoles.forEach((r,i) => {
				if (oldRoles.indexOf(r) === -1) {
					role = r;
				}
			});
		}
		
		await SERVICES.guildService.getExecutorForRoleChangeFromAuditLog(role, oldMember.id)
		
		.then(async (responseObj) => {
			if (responseObj === "BYPASS") {
				// Do nothing. The console is already logged for this bypass.
			} else {
				guild = newMember.guild.id;
				author = responseObj !== "FAILURE" ? SERVICES.guildService.getMemberFromCache(responseObj.authorId) : oldMember.client.user.id;
				auditAction = responseObj !== "FAILURE" ? responseObj.auditAction : "UNKNOWN";
				// For drunktankRole & minorRole only
				duration = CONFIG.servers[oldMember.guild.id].tankDuration;
				uom = CONFIG.servers[oldMember.guild.id].tankUOM;
				reason = "Manual ";
				
				if ((role !== CONFIG.servers[oldMember.guild.id].drunktankRole) && (role !== CONFIG.servers[oldMember.guild.id].minorRole)) {
					// If it wasn't drunktankRole, we are logging who did it into the modlog.
					return await SERVICES.guildService.writeToChannel("modlogChannel", HELPERS.messages.log_role_change(author, newMember, role, auditAction));
				}
				
				// Drunktank or Minor Role is involved in this audit log for the affected user, and not done by a bypassing User.
				// Determine the auditAction if the audit log entry is missing
				if (responseObj === "FAILURE") {
					if ((
					  !oldRoles.includes(CONFIG.servers[oldMember.guild.id].drunktankRole) && 
					  newRoles.includes(CONFIG.servers[oldMember.guild.id].drunktankRole)
					) || (
					  !oldRoles.includes(CONFIG.servers[oldMember.guild.id].minorRole) && 
					  newRoles.includes(CONFIG.servers[oldMember.guild.id].minorRole)
					))
					 {
						auditAction = "$add";
					}
					if ((
					  oldRoles.includes(CONFIG.servers[oldMember.guild.id].drunktankRole) && 
					  !newRoles.includes(CONFIG.servers[oldMember.guild.id].drunktankRole)
					) || (
					  oldRoles.includes(CONFIG.servers[oldMember.guild.id].minorRole) && 
					  !newRoles.includes(CONFIG.servers[oldMember.guild.id].minorRole)
					)) {
						auditAction = "$remove";
					}
					if (auditAction === "UNKNOWN") {
						await SERVICES.guildService.writeToChannel("modLogChannel","**ATTENTION <@&" + CONFIG.servers[oldMember.guild.id].botMasterRole + ">\n<@&" + role + "> role change was detected for <@" + newMember.id + "> (" + newMember.user.tag + ") (" + newMember.id + ")\n**No Audit Log Entry could be found**\nCould not determine if the role was granted or removed.");
						throw (" role (" + role + ") change was detected for " + newMember.id + " (" + newMember.user.tag + ")\nNo Audit Log Entry could be found\nCould not determine if the role was granted or removed.");
					}
				}
				if (auditAction === "$remove") {
					//Looks like drunktankRole or minorRole was removed. determine which one
					if (role === CONFIG.servers[oldMember.guild.id].drunktankRole) {
						tankedUserJson = await SERVICES.persistenceService.getTankedUsers(oldMember.guild.id,true,oldMember.id);
						correctUser = false;
						Object.entries(tankedUserJson).forEach(([timetanked,tUserObj]) => {
							if (tUserObj.user_tanked === oldMember.id) {
								// This record is for the correct user that is still in the tank
								reason += "untanking";
								correctUser = true;
								tankedUserJson = tUserObj;
							}
						});
						if (correctUser) {
							return await SERVICES.drunkTankService.untankUser(guild, newMember, author, tankedUserJson, reason);
						} else {
							throw "User was not found in the tank!";
						}
					} else if (CONFIG.servers[oldMember.guild.id].minorRole) {
						minorUserJson = await SERVICES.persistenceService.getMinorUsers(oldMember.guild.id,oldMember.id);
						correctUser = false;
						Object.entries(minorUserJson).forEach(([userID,userObj]) => {
							if (userID === oldMember.id) {
								// This record is for the correct user that still needs to verify their age
								correctUser = true;
								minorUserJson = userObj;
							}
						});
						if (correctUser) {
							return await SERVICES.minorService.verifyUser(guild, newMember, author, minorUserJson);
						} else {
							throw "User was not found in ageVerify!";
						}
					} else {
						throw "undetermined role removed from user " + oldMember.id;
					}
				} 
				if (auditAction === "$add")	{
					//Looks like drunktankRole or minorRole was granted. determine which one
					if (role === CONFIG.servers[oldMember.guild.id].drunktankRole) {
						reason += 'tanking';
						return SERVICES.drunkTankService.tankUser(guild, newMember, author, reason, duration, uom);
					}
					if (CONFIG.servers[oldMember.guild.id].minorRole) {
						// Don't process a suspected user if they have the verifiedRole
						if ((oldMember._roles.includes(CONFIG.servers[oldMember.guild.id].verifiedRole)) && (newMember._roles.includes(CONFIG.servers[oldMember.guild.id].verifiedRole))) {
							await SERVICES.guildService.writeToChannel("logChannel","<@" + author.id +
							  ">\r\nMember <@" + newMember.id +"> has the verifiedRole. Remove it then try again.")
							.then(() =>{
								//SERVICES.guildService.setRolesForMember(oldMember.id, oldMember._roles);
								//throw "has_verifiedRole";
								return; // problems with removing the role - triggers 3 times on one execution, spams the log.
							});
						} else {
							return SERVICES.minorService.suspectUser(guild, newMember, author);
						}
					}
					throw "undetermined role granted to user " + oldMember.id;
				}
			}
		})
		.catch((ex) => {
			HELPERS.logger.log("exception: " + ex + " in memberUpdateEvent.");
		});
	}
	return;
}

exports.handle = handle;