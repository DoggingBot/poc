async function Query(query, getFields){
	const mysql = require('mysql2/promise');
	const con = await mysql.createConnection(CONFIG.dbServer);	
	
	let stmt = "";
	if (query.create) {
		stmt += "CREATE TABLE `" + CONFIG.dbServer.database + "`.`" + query.create + "` (" + query.columns.join() + ") Engine = InnoDB";
	}
	if (query.select) {
		stmt += "SELECT " + query.columns.join() + " FROM `" + CONFIG.dbServer.database + "`.`" + query.select + "` ";
	}
	if (query.insert) {
		stmt += "INSERT INTO `" + CONFIG.dbServer.database + "`.`" + query.insert + "` (" + query.columns.join() + ") VALUES " + query.valueHolders;
	}
	if (query.update) {
		stmt += "UPDATE `" + CONFIG.dbServer.database + "`.`" + query.update + "` SET " + query.sets;
	}
	if (query.del) {
		stmt += "DELETE FROM `" +CONFIG.dbServer.database + "`.`" + query.del + "`";
	}
	if (query.where) {
		stmt += " WHERE " + query.where;
	}
	if (query.orderby) {
		stmt += " ORDER BY " + query.orderby;
	}
	//console.log(stmt + "\nValues: " + JSON.stringify(query.values));
	let [rows, fields] = await con.execute(stmt,query.values).then(con.end());
	var columns = [];
	if (fields !== undefined) {
		fields.forEach((f) => {
			columns.push(f.name);
		});
	}
	if (getFields) {
		return [rows,columns];
	}
	return rows;
}

module.exports = {
	Query : Query
};