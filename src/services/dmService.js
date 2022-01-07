async function respondDM(message) {
	// Bot Developers that have rights to trigger anything in ./developer/
	// If a user in the below array DM's the bot with the correct developer command, the bot will oblige.
	var developers = ["92092480073236480"];
	if (developers.includes(message.author.id)) {
		if (DEVELOPER[message.content.split(" ")[0]] !== undefined) {
			return DEVELOPER[message.content.split(" ")[0]].handle(message);
		}
	}
	// Handles all other DM messages
	let msg = HELPERS.helpers.fisherYates(RETORTS);
	return message.channel.send(msg[0]);
}
exports.respondDM = respondDM;