var moment = require('moment');

async function filterTankStats(guild, user) {
	var json = SERVICES.persistenceService.getTankedUsers(guild);
	
	if (user) {
		Object.entries(json).forEach(([i,o]) => {
			if (!((o.user_tanked === user.id) || (o.tanked_by === user.id) || (o.untanked_by === user.id))) {
				delete json[i];
			}
		});
	}
	
	return json;
}

async function getTankStatsStr(json, filtered) {
    var tankerStats = {};
		var untankerStats = {};
		var tankeeStats = {};
    var currentTanked = 0;
    var everTanked = 0;

    //Build our tankee and tanker stats
    Object.entries(json).forEach( ([i,o]) => {
        everTanked++;
        if (!o.time_untanked) currentTanked++;
				
        if (tankeeStats[o.user_tanked] == undefined) {
            tankeeStats[o.user_tanked] = 1;
        } else {
            tankeeStats[o.user_tanked]++;
        }
        if (tankerStats[o.tanked_by] == undefined) {
            if (!o.tanked_by) {
                return;
            }
            tankerStats[o.tanked_by] = {};
						tankerStats[o.tanked_by][o.user_tanked] = 1;
        } else {
            if (tankerStats[o.tanked_by][o.user_tanked] == undefined) {
							tankerStats[o.tanked_by][o.user_tanked] = 1;
						} else {
							tankerStats[o.tanked_by][o.user_tanked]++;
						}
        }
				if (untankerStats[o.untanked_by] == undefined) {
            if (!o.untanked_by) {
                return;
            }
            untankerStats[o.untanked_by] = {};
						untankerStats[o.untanked_by][o.user_tanked] = 1;
        } else {
            if (untankerStats[o.untanked_by][o.user_tanked] == undefined) {
							untankerStats[o.untanked_by][o.user_tanked] = 1;
						} else {
							untankerStats[o.untanked_by][o.user_tanked]++;
						}
        }
    });

    //Trim to be the top 5 only
    tankeeTopFive = getTopFive(tankeeStats);
    tankerTopFive = getTopFive(tankerStats);
		untankerTopFive = getTopFive(untankerStats);
    uniqueTanked = Object.keys(tankeeStats).length;
		
		msg = "=== Tankstats ===";
		if (filtered) {
			var mrec = 0;
			// First check if the user is/was a staff member
			if ((tankerStats[filtered.id] !== undefined) || (untankerStats[filtered.id] !== undefined)) {
				//Include Staff Info
				msg += "\r\nStaff Member: <@" + filtered.id + ">" +
				"\r\n --Top 5 Tanked--";				
				await tankeeTopFive.forEach((obj,i)=> {
						msg+= "\r\n" + (i + 1) + ". <@" + obj.name + "> has been tanked " + obj.count + " times.";
				});
				await tankerTopFive.forEach((obj,i) => {
					let vn = "";
					let vc = 0;
					Object.entries(tankerStats[obj.name]).forEach((v) => {
						if (v[1] > vc) {
								vn = v[0];
								vc = v[1];
						}
					});
					msg += "\r\n" + obj.name + " has tanked on " + obj.count + " occasions ("+Object.keys(tankerStats[obj.name]).length+" unique users). Favourite victim: <@" +  vn + ">";
				});
			} else {
				// Add tankee info
				msg += "\r\nServer Member: <@" + filtered.id + ">";
				Object.entries(json).forEach(([i,o]) => {
					if (parseInt(i,10) > parseInt(mrec,10)) {
						mrec = i;
					}
				});
				mrec = json[mrec];
				msg += "\r\nTanked " + tankeeStats[filtered.id] + " times."
			}
			msg += "\r\nMost Recent Tanking: <@" + mrec.user_tanked + "> tanked by <@" + mrec.tanked_by + "> on " +
			moment(mrec.time_tanked).format("ddd MMM D, YYYY HH:mm:ss UTC");
		}
    msg += await convertToString(tankeeTopFive, tankerTopFive, untankerTopFive, tankerStats, untankerStats, currentTanked, everTanked, uniqueTanked);
		return msg;
}


async function convertToString(tankeeTopFive, tankerTopFive, untankerTopFive, tankerStats, untankerStats, currentTanked, everTanked, uniqueTanked) {
		msg = "\r\nThere are " + currentTanked + " people currently tanked.";
    msg += "\r\n" + everTanked + " tankings have occurred in total.";
    msg += "\r\n" + uniqueTanked + " unique users have been tanked.";
    msg += "\r\n\r\n==Drunk Tank Hall of Shame==";
    await tankeeTopFive.forEach((obj,i)=> {
        msg+= "\r\n" + (i + 1) + ". <@" + obj.name + "> has been tanked " + obj.count + " times.";
    });
    msg += "\r\n\r\n==Most Korrupt Staff==";
    await tankerTopFive.forEach((obj,i) => {
	    let vn = "";
			let vc = 0;
      Object.entries(tankerStats[obj.name]).forEach((v) => {
			if (v[1] > vc) {
			    vn = v[0];
			    vc = v[1];
			}
		});
		if (obj.name != "") {
            msg += "\r\n" + (i + 1) + ". <@" + obj.name + "> has tanked on " + obj.count + " occasions ("+Object.keys(tankerStats[obj.name]).length+" unique users). Favourite victim: <@" +  vn + ">";
        }
    });
		msg += "\r\n\r\n==Staff That Care==";
    await untankerTopFive.forEach((obj,i) => {
	    let vn = "";
			let vc = 0;
      Object.entries(untankerStats[obj.name]).forEach((v) => {
			if (v[1] > vc) {
			    vn = v[0];
			    vc = v[1];
			}
		});
		if (obj.name != "") {
            msg += "\r\n" + (i + 1) + ". <@" + obj.name + "> has untanked on " + obj.count + " occasions ("+Object.keys(untankerStats[obj.name]).length+" unique users). Soft spot for: <@" +  vn + ">";
        }
    });

    return msg;
}


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

exports.getTankStatsStr = getTankStatsStr;
exports.filterTankStats = filterTankStats;