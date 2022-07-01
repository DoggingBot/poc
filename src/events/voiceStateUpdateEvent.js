/*
Handle member voiceStateUpdate events
we want to catch any member joining or leaving a channel
*/
async function handle(oldState, newState) {
	// Check channel information
    if (oldState.channelID === newState.channelID) {
        // No change in channel.
        return false;
    }

    // Is it a user with the special role? -- originally checked for all staff member roles as well, but has been reduced to allow a choice.
    if (
        (oldState.member._roles.includes(CONFIG.servers[oldState.guild.id].uncountedLimitRole)) //|| All by itelf
        //(oldState.member._roles.includes(CONFIG.servers[oldState.guild.id].botUserRole)) || // barbacks
        //(oldState.member._roles.includes(CONFIG.servers[oldState.guild.id].modUserRole)) || // mods
        //(oldState.member._roles.includes(CONFIG.servers[oldState.guild.id].botMasterRole)) || // druncord CIO
        //(oldState.member.permissions.has(1 << 3)) // Anyone with admin permission
    ) {
        if (
            (oldState.channelID === null) && (newState.channelID !== null))
        {
            // Staff Connected to channel
            await updateLimit(newState.guild.id, newState.channel, 1);
        }

        if (
            (oldState.channelID !== null) && (newState.channelID === null))
        {
            // Staff disconnected from channel
            await updateLimit(newState.guild.id, oldState.channel, -1);
        }

        if (
            (oldState.channelID !== null) && (newState.channelID !== null))
        {
            // Staff moved to another channel.
            await updateLimit(newState.guild.id, oldState.channel, -1);
            await updateLimit(newState.guild.id, newState.channel, 1);
        }
    }
}

async function updateLimit(guildID, channelObj, amt) {
    let ch = await COMMANDS.chlimits.getLimits(guildID, channelObj.id);
    if (Object.keys(ch)[0] !== 'No channel limits have been set') {
        // Is a saved limited channel
        if (amt + channelObj.userLimit < ch[channelObj.id]) {
            // Don't reduce the limit. It's already at it's intended max user limit.
        } else {
            channelObj.setUserLimit((channelObj.userLimit + amt), ( amt > 0 ? "Limit Increased - Staff Joined" : "Limit Decreased - Staff Left"));
        }
    }
}

exports.handle = handle;