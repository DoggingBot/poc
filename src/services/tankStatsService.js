
var persistenceService = require('./persistenceService');

const HELPERS = require('../helpers/helpers');

var CONFIG;

function injectConfig(myConfig) {
    CONFIG = myConfig;
}

async function getTankStatsStr() {
    var json = persistenceService.getTankHistory();

    var tankerStats = {};
    var tankeeStats = {};
    var currentTanked = 0;
    var everTanked = 0;

    //Build our tankee and tanker stats
    json.forEach( (obj) => {
        everTanked++;
        if (!obj.archive) currentTanked++;
				
        if (tankeeStats[obj.user_tanked] == undefined) {
            tankeeStats[obj.user_tanked] = 1;
        } else {
            tankeeStats[obj.user_tanked]++;
        }
        if (tankerStats[obj.tanked_by] == undefined) {
            if (obj.tanked_by == "Unknown") {
                return;
            }
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

    //Trim to be the top 5 only
    tankeeTopFive = getTopFive(tankeeStats);
    tankerTopFive = getTopFive(tankerStats);
    uniqueTanked = Object.keys(tankeeStats).length;
	
    return convertToString(tankeeTopFive, tankerTopFive, tankerStats, currentTanked, everTanked, uniqueTanked);
}


async function convertToString(tankeeTopFive, tankerTopFive, tankerStats, currentTanked, everTanked, uniqueTanked) {
    var msg = "There are " + currentTanked + " people currently tanked.";
    msg += "\r\n" + everTanked + " tankings have occurred in total.";
    msg += "\r\n" + uniqueTanked + " unique users have been tanked.";
    msg += "\r\n\r\n==Drunk tank hall of shame==";
    await tankeeTopFive.forEach((obj,i)=> {
        msg+= "\r\n" + (i + 1) + ". " + HELPERS.getAtString(obj.name) + " has been tanked " + obj.count + " times.";
    });
    msg += "\r\n\r\n==Most Korrupt Mods==";
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
            msg += "\r\n" + (i + 1) + ". " + obj.name + " has tanked on " + obj.count + " occasions ("+Object.keys(tankerStats[obj.name]).length+" unique users). Favourite victim: " +  HELPERS.getAtString(vn);
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

exports.injectConfig = injectConfig;
exports.getTankStatsStr = getTankStatsStr;