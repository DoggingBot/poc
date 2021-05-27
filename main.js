const BOT_VERSION = "1.1.0";

//Setup config file
if (process.argv.length < 3) {
    console.log("Please pass the config file as a parameter.");
    return;
}
configFile = process.argv[2];
const config = require('./config/' + configFile);
const helpers = require('./helpers');
const persistence = require('./persistence');
const messages = require('./messages');
const drunktank = require('./drunktank.js');

drunktank.injectDependencies(config, persistence, messages, helpers);

console.log(config.bot_name + " " + BOT_VERSION + " starting up");
console.log("Configuration: " + configFile);

persistence.injectConfig(config);
helpers.injectConfig(config);

const Discord = require("discord.js");
const client  = new Discord.Client({
    ws: { intents: Discord.Intents.ALL } 
});
client.login(config.access_key);


client.on("ready", () => {
    console.log(config.bot_name + " successfully started.");
});

client.on("guildMemberUpdate", async (o,n) => {
	var oldRoles = o._roles;
	var newRoles = n._roles;
    //check if the roles have changed
    if (JSON.stringify(oldRoles) == JSON.stringify(newRoles)) {
        console.log("Handled event with no role changes");
        return;
    }

    //ensure any role changes involves 2drunk2party
    if (!(oldRoles.includes(config.drunktankRole) || newRoles.includes(config.drunktankRole))) {
        console.log("Handled role change event that didn't involve 2drunk2party.");
        return;
    }

    //This audit log part needs to be pulled out to another js file 
	var auditlog = await n.guild.fetchAuditLogs({
		limit: 1,
		type: 'MEMBER_UPDATE_ROLES'
	});
	auditlog = auditlog.entries.first();

    //Ensure we don't cause any errors
    if (auditlog.changes == undefined) {
        console.log("Handled event with no audit log changes");
        return;
    }
    if (auditlog.changes[0]["new"] == undefined) {
        console.log("Handled event with no audit log NEW changes");
        return;
    }
	
    if (config.bypassGMU.includes(auditlog.executor.id)) {
        console.log("Handled event performed by the bot");
        //Action was by the bot;
        return;
    }

	if (auditlog.changes[0]["new"][0].id === config.drunktankRole && auditlog.target == o.id) {
		// Drunktank Role is involved in this audit log for the affected user, and not done by a bypassing User.
        guild = n.guild;
        tankedUser = n;
        authorStr = auditlog.executor.username;
        reason = "Manual tanking -- Reason to be provided.";
        duration = config.tankDuration;
        uom = config.tankUOM;

		if ((oldRoles.includes(config.drunktankRole)) && (!newRoles.includes(config.drunktankRole)) &&
		   (auditlog.changes[0].key === "$remove")) {
			// Member was in tank, now they are not.
            // check if we have a record of them being tanked so we can return their roles
            tankedUserJson = persistence.getUser(tankedUser); 

			return drunktank.untankUser(guild, tankedUser, tankedUserJson, authorStr);
		} else if ((!oldRoles.includes(config.drunktankRole)) && (newRoles.includes(config.drunktankRole)) && 
		(auditlog.changes[0].key === "$add"))	{
			// Member was not in the tank, now they are. 
            return drunktank.tankUser(guild, tankedUser, authorStr, reason, duration,uom);
		}
        
	}		
});


client.on("message", async  (message) => {
    // It will do nothing when the message doesnt start with the prefix
    if(!message.content.startsWith(config.commandPrefix)) return;

    if (message.content.startsWith(config.commandPrefix + config.commandPrefix)) return;

    const command = helpers.trimCommand(message);
    const msg = helpers.trimMsg(message);

    fetchObj = {
        user: message.author,
        cache: false,
        force: true
    };

    refreshedAuthorObj = await message.guild.members.fetch(fetchObj);
    
    if (!helpers.doesUserHaveRole(refreshedAuthorObj, config.botMasterRole)) {
        console.log ("UNAUTHORIZED USAGE ATTEMPT: " + message.author.username + " Tried to use me with this command: " + command);
        //message.channel.send("You don't have the rights to use me you filthy swine.");
        return;
    }
  
    switch (command) {
        case "help":
            handleHelp(message);
            break;
        
        case "tank":
            return handleTank(message, msg);
            break;

        case "untank":
            return handleUntank(message, msg);
            break;

        case "checktank":
            handleCheckTank(message);
            break;

        case "tankstats":
            handleTankStats(message);  
            break;

        case "bacon":
            handleBacon(message);  
            break;

        case "synctank":
            return handleSyncTank(message);
            break;

        default:
            message.channel.send("I don't know that command. Want me to build it? Do it yourself you lazy throbber");
            break;
    }
});


async function handleSyncTank(message) {
    refreshedRoleObj = await message.guild.roles.fetch(config.drunktankRole, false, true);
    var tankees = persistence.getTankedUsers();
    var tankedDict = {};

    for (n=0;n<tankees.length; n++) {
        var obj = tankees[n];
        if (obj.archive) {
            continue;   
        }
        tankedDict[obj.user_tanked] = obj;
    }

    var toSave = [];
    var usersWithRoleDict = {};
    refreshedRoleObj.members.forEach( (key,value) => {
        var dictKey = key.user.id;

        if (tankedDict[dictKey] == undefined) {
            //we need to add this user to the tank json.
            message.channel.send(dictKey + " is missing from my tank log. Adding now.");
            toSave.push(dictKey);
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

    for (n=0; n<toSave.length; n++) {
        persistence.saveTanking("Unknown", message.guild, toSave[n], "Added by synctank command", [], config.tankDuration, config.tankDuration);
    }

    toSaveUntank.forEach((x)=> {
        persistence.untankUser(x);
    });

    message.channel.send("TankSync complete. " + toSave.length + " entries added to the tank log, " + toSaveUntank.length + " removed.");
}
function handleUntank(message, msg) {
    tokens = helpers.tokenize(msg.substr(1,msg.length -1 ));
        
    if (tokens.length < 1) {
        message.channel.send("Invalid arguments. Correct usage: &&untank @user optionalreason");
        return;
    }
    var reason = helpers.getReason(tokens);
    if (!helpers.validateMentions(message, "untank", config.commandPrefix)) {
        return;
    }
    if (reason.replace(/[^A-Za-z0-9]/g, '') == "") {
        reason = "Default - assume time served.";
    }

    var guild = message.guild;
    var authorStr =  message.author.username;
    var untankedMember = message.guild.member(message.mentions.users.first());

    user = persistence.getUser(untankedMember.user.id);

    if (user == undefined){
        //dont do anything if they are not in our log. we might strip them of their roles by accident.
        message.channel.send("User not found in tank log. Do it manually or run tanksync please.");
        return;
    }

    return drunktank.untankUser(guild, untankedMember, user, authorStr)
        .then((rolesGivenBack)=> {
            msg = messages.confirm_untank_message(authorStr, untankedMember.user.username, reason, rolesGivenBack);
            return message.channel.send(msg);
        });
}


async function handleTank(message, msg) {
    var guild = message.guild;
    var tankedMember = message.guild.member(message.mentions.users.first());
    var authorStr =  message.author.username;
    const role = await guild.roles.fetch(config.drunktankRole);
    tokens = helpers.tokenize(msg.substr(1,msg.length -1 ));

    // ======================================
    // ============= validation =============
    // ======================================
    if (tokens.length < 2) {
        message.channel.send("Invalid arguments. Correct usage: &&tank @user reason");
        return;
    }

    //Move customized timings to seperate function
	var tankedFor = helpers.parseDurationFromTokens(tokens);
    //Reset our tokens array as we might need to remove an item (this needs refactored)
    tokens = tankedFor.newTokens;

    var reason = helpers.getReason(tokens);
		
    if (!helpers.validateReason(reason, message)) {
        return;
    }
    if (!helpers.validateMentions(message, "tank", config.commandPrefix)) {
        return;

    }

    //actually tank the user
    return drunktank.tankUser(guild, tankedMember, authorStr, reason, tankedFor.duration, tankedFor.uom)
        .then( () => {
            msg = messages.confirm_message(authorStr, tankedMember.user.username, reason, role.name);
            return message.channel.send(msg);
        });
}
function handleCheckTank(message) {
    let ts = Date.now();
    var json = persistence.getTankedUsers();
    var concat = "";
    var toSend = [];
    for (n=0;n<json.length; n++) {
        var obj = json[n];
        if (obj.archive) {
            continue;   
        }
        var datediff = helpers.getDateDiffString(ts, obj.time_tanked);
        if (obj.tanked_by == "Unknown") {
            msg = obj.user_tanked + " was not tanked by me. I learned about them " + datediff + " ago."; 
        }
        else {
            msg = "(tanked " + datediff + " ago by " + obj.tanked_by + " for " + obj.reason + ")";
            if (ts > obj.time_to_untank) {
                msg = helpers.getAtString(obj.user_tanked) + " has served their time. " + msg; 
            }
            else {
                msg = helpers.getAtString(obj.user_tanked) + " still has time to wait. " + msg
            }
        }

        //beware of the max length for a message
        if ((concat + '\r\n' + msg).length >= 2000) {
            toSend.push(concat);
            concat = msg;
        }
        else {
            concat += '\r\n' + msg;
        }
    }
    if (concat != "") toSend.push(concat);

    if (toSend.length == 0) {
        message.channel.send("According to my records, the drunk tank is empty!");
    }
    else {
        toSend.forEach((obj) => {
            message.channel.send(obj);
        });
    }
}

function handleTankStats(message) {
    var json = persistence.getTankedUsers();

    var tankerStats = {};
    var tankeeStats = {};
    var currentTanked = 0;
    var everTanked = 0;

    json.forEach( (obj) => {
        everTanked++;
        if (!obj.archive) currentTanked++;
				
        if (tankeeStats[obj.user_tanked] == undefined) {
            tankeeStats[obj.user_tanked] = 1;
        } else {
            tankeeStats[obj.user_tanked]++;
        }
        if (tankerStats[obj.tanked_by] == undefined) {
            tankerStats[obj.tanked_by] = {};
			tankerStats[obj.tanked_by][obj.user_tanked] = 1;
        } else {
            if (tankerStats[obj.tanked_by][obj.user_tanked] == undefined) {
				tankerStats[obj.tanked_by][obj.user_tanked] = 1;
			} else {
				tankerStats[obj.tanked_by][obj.user_tanked]++;
			}
        }
    });

    tankeeTopFive = getTopFive(tankeeStats);
    tankerTopFive = getTopFive(tankerStats);
		
    var msg = "There are " + currentTanked + " people currently tanked.";
    msg += "\r\n"+everTanked+" tankings have occurred in total.";
    msg += "\r\n"+Object.keys(tankeeStats).length+" unique users have been tanked.";
    msg += "\r\n==Drunk tank hall of shame==";
    tankeeTopFive.forEach((obj,i)=> {
        msg+= "\r\n" + (i + 1) + ". " + obj.name + " has been tanked " + obj.count + " times.";
    });
    msg += "\r\n==Most Korrupt Mods==";
    tankerTopFive.forEach((obj,i) => {
			  let vn = "";
				let vc = 0;
        Object.entries(tankerStats[obj.name]).forEach((v) => {
						if (v[1] > vc) {
								vn = v[0];
								vc = v[1];
						}
			  });
				if (obj.name != "") {
            msg += "\r\n" + (i + 1) + ". " + obj.name + " has tanked on " + obj.count + " occasions ("+Object.keys(tankerStats[obj.name]).length+" unique users). Favourite victim: " + vn;
        }
    });
    
    message.channel.send(msg);
}
// JS reduced down and optimized, makes use of Arrays.sort() and .splice() for a quick top 5.
// Output array is simplified.
function getTopFive(stats) {
		var top5 = [];
		Object.entries(stats).forEach((r) => {
				var k = r[0];
				var v = r[1];
				
				if (typeof v === "object") {
						var c = 0;
						Object.entries(v).forEach((i) => {
								c += i[1];
						});
						top5.push({'name':k,'count':c});
				} else {
						top5.push({'name':k,'count':v});
				}
				
				top5.sort((a,b) => {return b.count - a.count;});
				top5.splice(5);
		});
		return top5;
}

function handleHelp(message) {
    var help = "==help==" +
        "\r\n" + config.commandPrefix +"tank - drunk tanks a user. usage: "+config.commandPrefix+"tank @user reason." +
        "\r\n" + config.commandPrefix +"checktank - Checks the current users in the tank." +
        "\r\n" + config.commandPrefix +"untank - Untank a user. usage: "+config.commandPrefix+"untank @user reason." +
        "\r\n" + config.commandPrefix +"tankstats - Stats for fun. " +
        "\r\n" + config.commandPrefix +"synctank - sync up the 2drunk2party role with the Bot tank log. " +        
        "\r\n" + config.commandPrefix +"help - Sends this help message" +
        "\r\n" +
        "\r\n" + config.bot_name + " " + BOT_VERSION + " by stevie_pricks & Sindrah";


    message.channel.send(help);
}

function handleBacon(message) {
    message.channel.send("BACON IS DELICIOUS AND YOUR MA IS A MATTRESS");
}
