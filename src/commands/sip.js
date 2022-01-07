function help() {
    return "";
}

async function handle(message) {
    var action = message.content.toLowerCase();
    var userId = message.author.id;
	var mention = "<@" + userId + ">";
    var guild = message.guild.id; // previously nickname, no longer necessary as message.author.nickname is available.
    // The bot Writer doesn't normally sip on his offtime, and the bot respects that, mostly because the bot writer sips so much when coding the bot couldn't even count
	// Output a special message inflating the bot writer's ego, and return out.
	if (userId === "92092480073236480") {
		message.channel.send("<@92092480073236480>, you sipped alcohol so much during my development, I'd wager it's well over 9000. I stopped counting your sips long ago.");
		return;
	}
	// Don't allow sips in the tankChannel
	if (message.channel.id === CONFIG.servers[message.guild.id].tankChannel) {
		return;
	}
	var userObj = await SERVICES.persistenceService.addSip(guild, action, userId, message.createdTimestamp);
		
		var acting = action + action.substr(-1) + "ing";
		var slowdowns = [
		  "Hey! Slow down " + mention + ", this ain't a race!",
			"I admire your enthusiasm for the art " + mention + ", but " + acting + " is a subtle practice you don't need to rush.",
			"If you rush into " + acting + " this much, I don't wanna know what you do in your spare time. Try waiting a little bit between " + action + "s there " + mention + ".",
			"Thought you'd get credit for spamming those " + action + "s so fast, did ya? Fat chance! Try slowing it down a bit " + mention + ".",
			"Ya know " + mention + ", you really should wait a bit longer between " + action + "s."
		];
		var msgString;
		
		// Was the sip rejected for being too soon?
		if ((userObj.slow !== undefined) && (userObj.slow)) {
			msgString = HELPERS.helpers.fisherYates(slowdowns)[0];
		} else {
		
			var trailing_s = ""
			if (userObj[action] > 1) {
					trailing_s = "s"
			}

			msgString = "<@" + userObj.userId + 
					"> has enjoyed " + userObj[action] + " " + action + trailing_s;

			if (userObj[action] % 69 == 0 || userObj[action] % 420 == 0) {
					msgString += ". Nice.";
			}

			if (userObj[action] == 42) {
					msgString = action + "ing 42 " + action + "s is the answer to the ultimate Question of life, the universe, and everything.";
			}
			else if (userObj[action] == 100) {
					msgString = "100 " + action +"s is a proud moment for any pisshead.";
			}
			else if (userObj.count == 1000) {
					msgString = "1000 " + action + "s. That is impressive dedication to the art. Three cheers for <@" + userObj.userId + ">! 🎉🎉🎉🎉🎉🎉";
			}
			else {
					if (Math.floor((Math.random()*100) + 1) == 50) {
						//make one in every 100 say something else
						switch (action) {
							case "sip":
								msgString = "You take a sip from your trusty vault 13 canteen.";
						}
					}
			}
		}
    message.channel.send(msgString);
}

exports.handle = handle;
exports.help = help;