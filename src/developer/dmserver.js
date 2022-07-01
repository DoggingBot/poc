function handle(message) {
    // Break down message
    m = message.content.split(" ");
    let channel = message.client.channels.cache.get(m[1]);
    if ((channel === undefined) || (channel === null)) {
	  message.channel.send("Failed to send message to channel " + m[1] + ". Channel does not exist.");
      return false;
    }
    let msg = m;
    msg.splice(0,2);
    msg = msg.join(" ");
    try {
        channel.send(msg)
        .then(()=>{
            message.channel.send("Sending message to server.");
        });
    } catch(e) {
        message.channel.send("Failed to send message to channel <#" + channel.id + "> (" + channel.id + ") - " + e);
    }
    return true;
}

exports.handle = handle;