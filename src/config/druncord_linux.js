require('dotenv').config();
const access_key = process.env.druncord_access_key;
const bot_name = "TankCommander";
const dbServer = {
	host: process.env.db_host,
  port: parseInt(process.env.db_port),
  user: process.env.db_user,
  password: process.env.db_pass,
  database: process.env.db_database
};
exports.access_key = access_key
exports.bot_name = bot_name
exports.dbServer = dbServer;