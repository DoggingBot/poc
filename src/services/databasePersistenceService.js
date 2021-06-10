const { MongoClient } = require("mongodb");
var CONFIG;
var CONNECTIONG_STRING;
var client;

function injectConfig(_cfg) {
    CONFIG = _cfg;
}

function init(connString) {
    CONNECTIONG_STRING = connString;
    client = new MongoClient(connString);
}

/*
returns all active tank records about a user
*/
async function getTankedUser(userIdToGet) {
    try {
        await client.connect();

        const database = client.db(CONFIG.databaseName);
        const drunkTank = database.collection(CONFIG.drunkTankCollection);
        const result = await drunkTank.find({
            user_tanked: userIdToGet,
            archive: false
        });

        var retval = [];
        await result.forEach((tankRecord) => {
            retval.push(tankRecord);
        });

        return retval;
    }
    finally {
        await client.close();
    }
}

/* 
Store a new tanking record
*/
async function putTankedUser(userObjToPut) {
    try {
        await client.connect();

        const database = client.db(CONFIG.databaseName);
        const drunkTank = database.collection(CONFIG.drunkTankCollection);
        const result = await drunkTank.insertOne(userObjToPut);
    }
    finally {
        await client.close();
    }
}

/* 
Update one or more tanking records
*/
async function putUpdatedRecords(updatedRecords) {
    try {
        await client.connect();
        const database = client.db(CONFIG.databaseName);
        const drunkTank = database.collection(CONFIG.drunkTankCollection);

        await updatedRecords.forEach(async (tankRecord) => {
            const filter = { user_tanked: tankRecord.user_tanked, time_tanked: tankRecord.time_tanked };
            const options = { upsert: true };
            const result = await drunkTank.replaceOne(filter, tankRecord, options);
            return result;
        });
    }
    finally {
        //await client.close();
    }
}

exports.init = init;
exports.injectConfig = injectConfig;
exports.getTankedUser = getTankedUser;
exports.putTankedUser = putTankedUser;
exports.putUpdatedRecords = putUpdatedRecords;