# Druncord Tanking Bot

Druncord's in-house bot that handles role management for problematic users, and handles some logging for actions.

Drunk tanking is where a custom role is given that blocks access to most channels for a set period of time for them to cool off.

Relies on Discord.js v12 - 

# How to use

To run with the existing config, use:
* npm run testserver - connects to test server using test.js config
* npm run production - connects to druncord using druncord.js config
* ALTERNATE - set the appropriate configuration file in main.js line 7 to the filename without extension that should be used if hosted in an environment that cannot issue 'npm run', and set main.js as the start script.

Fill in a config file and pop it into the config folder. pass the name of the file as a command line argument like so:

node main.js configfilename

Will load the app with config file located in ./config/configfilename.js

Behaviour:
The Bot will react to the following events:
* inviteCreate - Stores the invite information into the database for comparing and tracking invite usage. Announces to invitesChannel with invite code and inviter's mention handle, current user.tag, and userID.
* inviteDelete - Deleted invites are not removed from the database, but instead have their db-stored deleted flag flipped to true for posterity. Announces to invitesChannel that the invite was deleted, its use count, and the creator's mention/tag/ID.
* userUpdate - used only to track username changes. passed to handler for guildMemberUpdate to reduce redundant code.
* guildMemberUpdate - Catches all role changes and nickname changes, and receives userUpdate username changes. Special consideration for drunktankRole being given or taken and passes information found in corresponding audit log entry for executing user (passed to drunktankService). All other roles given/taken are logged to rolesChannel with executor mention/tag/ID gave/took role.mention to/from target mention/tag/ID (currently will log all roles except drunktankRole given/taken by the bot when tanked/untanked). Username and Nickname changes are logged to namesChannel with mention/tag/ID and old/new name, specially marked for username change and nickname added/changed/removed.
* guildMemberAdd - Caught when a user joins/rejoins the server. Checks if the user has an active tank record, then assigns the drunktankRole to them if they still have time to server, otherwise gives their old roles back and closes the record with "time served". Checks the invite they used to join, incrememnts its use and logs the usage to invitesChannel and references the inviter and invite code.
* guildMemberRemove - logs their invite used (and inviter if known), date they joined the server and date their account was created (along with days/hours count from trigger), and determines if the user was kicked, banned, or left on their own. If a GuildBanAdd triggers the guildMemberRemove event whilst the user had an active tank record, drunktankService gets called to close the record with "Banned" as the reason.
* message - handles all messages the bot can see. Necessary to catch all commands and responses. Currently ignores messages created by users listed in bypassGMU (includes itself for good reason), and retorts back a random message found in the DB retorts table when DM'd (to be reworked if/when responses are expected from a DM).

The Bot will respond to the following commands:
* .tank - drunk tanks a user. usage: .tank @user [duration] reason. -- if duration is not valid, it is part of the reason
* .checktank - Checks the current users in the tank.
* .untank - Untank a user. usage: .untank @user [reason]. -- reason has default "Default - assume time served"
* .tankstats - Stats for fun. Shows top 5 tanked user, tankers, and untankers. Pass a second argument of userID/mention to filter results by involved user (currently nonworking).
* .sipstats - List the stats of all the counted strings (such as "sip") by showing the top 5. -- this command is not listed in help.
* .config - display or edit server configuration details - requires botMasterRole or Administrator privilege.
* .help - Sends the help message of the current commands

When a user is tanked, the bot will automatically remove all of their other roles (provided it has permissions to), excluding any roles listed in rolesToIgnore, and will apply the drunktankRole. It will re-grant the old roles when a user is untanked. This will work either via the commands or the handled events.

Config:

Configuration is held in 3 areas - .env, config/filename.js, and the config table in the database. .env contains sensitive information for the bot, such as the access_key for the bot_user, and the database connection details (including the DB user and password). The config file used will load the settings from .env and set the bot name for main.js. The remaining configuration settings have been migrated to be stored in the database on a per-server instance. The Discord Server configurations are:

commandPrefix - the character to be accepted as the command prefix. Limited to 1 character, default is "."
botMasterRole - role ID that can control all aspects of the bot, primarily configuration. Users with Administrator privileges are considered bot Masters. Currently limited to one role.
botUserRole - role ID that the bot will allow to use all commands except botMasterRole commands. Currently limited to one role.
drunktankRole - the role ID to use for tanking a user.
tankChannel - the channel ID that a tanked user can see - used for blocking sipCommand triggers and sending tankees a tank message.
logChannel - channel ID where to log tank/untank commands.
invitesChannel - channel ID where to log all created/deleted/used invites as well as invite and account information of a user that has left.
namesChannel - channel ID where to log all username and nickname changes.
modlogChannel - channel ID where to log all upper-level event logs (currently only includes role changes not involving drunktankRole).
bypassGMU - list of user/role IDs that the bot will ignore messages from - cannot command the bot at all. The bot itself does not need to be included, it already checks for itself.
rolesToIgnore - list of role IDs that will not be given or taken by the bot - default config adds the server Booster role to this list, just to avoid errors on attempts.
rolesICannotTank - list of role IDs the bot is explicitly forbidden from being able to tank/untank. botUserRole and botMasterRole cannot be tanked/untanked, no need to add them.
tankUOM - the default unit of measure - 'days', 'hours', or 'minutes' - for tanking when a duration is not specified with the tank command. Default is 'hours'.
tankDuration - the default amount of time to tank when a duration is not specified with the tank command. Default is 12.
writeMessageToDrunkTank - Whether or not to send an extra message to the tanked user in the drunktank about who tanked them, for how long, and why (if given). Default is false.
warnAuthorizedUsage - Whether the bot will respond, insultingly, to an unauthorized user's attempt to use a command. Default is false.
startServer - Boolean flag that determines if the bot is ready to respond to anything other than "configure" commands. Default is false.

When setting up a new server initially, the only base command that will be accepted is "configure" (not to be confused with "config"). "configure" can only be run by an Administrator when the server's "start" property is false. When the command with zero additional arguments is given, the bot is triggered to create a new configuration entry in the database as well as creating new tables for the server, initially loaded with default values. IMPORTANT: the channel that the command ".configure" is initially run in will be used for ALL the log channels until they are changed, so it is advised that the configure command is executed in a private channel. Once all the necessary settings have been configured, the ability to set the "start" property to true can be accepted, and the bot will commence.

NB: Be careful with your access key and your database connection information. Keep it out of source control. We keep ours in .env and have it gitignored. There may be other safe ways to store your sensitive connection information, but just be mindful of who can view it and how it could be revealed.

# License 

ISC License

You are free to use this as you please, however I take no responsibility for what you do with it and I won't provide any support.

Originally forked from: https://github.com/julianYaman/hello-world-discord-bot

Copyright 2021 Donald Carnegie, modified by kmatsumari.
Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
