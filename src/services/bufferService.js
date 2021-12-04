/* DEPRECATED AND REMOVED; CONFIG lives in global namespace of main.js
var CONFIG;
function injectConfig(_cfg) {
    CONFIG = _cfg;
}
*/

//instantiate our db connection manager
var dbManager = require('../managers/dbConnectionManager.js');

var query = null;
var buffers = {};

async function queryDB() {
	rec = await dbManager.Query(query);
	if (query.select) {
		buffers = {};
		rec.forEach((e) => {
			buffers.time = e;
		});
	} else {
		buffers = {};
	}
	query = null;
}

async function getBuffers() {
	query = {
			select: guild + "_buffers",
			columns: ["*"],
			where: "?",
			orderby: "time",
			values: [1]
		};
		
	await queryDB().then(() => {
			return buffers;
	});
}

async function saveBuffer(channel, msg) {
	query = {
		insert: guildID + "_buffers",
		columns: ["time","channel","msg"],
		valueHolders: "(?,?,?)",
		values: [Date.now(),channel,msg]
	};
	queryDB();
}

async function deleteBuffers(b) {
	var wv = [];
	b.forEach((e) => {
		wv.push("?");
	});
	query = {
		del: guildID + "_buffers",
		where: "id IN (" + wv.join + ")",
		values: b
	};
	queryDB();
}

//exports.injectConfig = injectConfig;
exports.getBuffers = getBuffers;
exports.saveBuffer = saveBuffer;
exports.deleteBuffers = deleteBuffers;