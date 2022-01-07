var query = null;
var buffers = {};

async function queryDB() {
	rec = await MANAGERS.dbConnectionManager.Query(query);
	if (rec === null) {
		console.log("[DB ERROR]: bufferService.queryDB()\nQuery: ", query);
	}
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

exports.getBuffers = getBuffers;
exports.saveBuffer = saveBuffer;
exports.deleteBuffers = deleteBuffers;