function handle(message) {
	message.channel.send("Reloading Commands.");
	return "RELOAD";
}

exports.handle = handle;