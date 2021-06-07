# Druncord Tanking Bot

Pretty mickey mouse discord bot for "drunk tanking" problem users.

Drunk tanking is where a custom role is given that blocks access to most channels for a set period of time for them to cool off.

# How to use

To run with the existing config, use:
* npm run testserver - connects to test server using test.js config
* npm run production - connects to druncord using druncord.js config

Fill in a config file and pop it into the config folder. pass the name of the file as a command line argument like so:

node main.js configfilename

Will load the app with config file located in ./config/configfilename.js

Behaviour:
The Bot will react to the following events:
* a member is given the drunktankRole
* a member has the drunktankRole taken away
* a member joining - if they have been drunk tanked in the past, it will update the state so their are reflected as tanked in .checktank. NB: This will NOT grant the role back itself, it expects a Role Persistence bot to do this for us. Role persistence may be incorporated at a later date.
* a member leaving - it will mark the member as archived but still tanked, so they do not appear in checktank whilst they are not a member of the server.

The Bot will respond to the following commands:
* .tank - drunk tanks a user. usage: .tank @user reason.
* .checktank - Checks the current users in the tank.
* .untank - Untank a user. usage: .untank @user reason.
* .tankstats - Stats for fun. 
* .synctank - sync up the 2drunk2party role with the Bot tank log. 
* .sipstats - List the stats of all the counted strings
* .help - Sends this help message

When a user is tanked, the bot will automatically remove all of their other roles (provided it has permissions to). It will re-grant these roles when a user is untanked. This will work either via the commands or the handled events.

Config:
* drunktankRole = Role ID for the role that locks a user out of the other channels
* tankChannel = Channel ID for the drunk-tank channel to message the tankee
* logChannel = Channel ID to log tank events to.
* botMasterRole = Role ID for the role that will be able to execute bot commands. No one without this role should be able to use. Disclaimer: Not tested and probably easily hackable.
* tankUOM = hours, minutes or days 
* tankDuration = default duration for people to remain in the tank
* commandPrefix = the bot command prefix
* access_key = Your discord bot access key. Keep this in .env and access via process.env
* json_path = Path to a local json file that the app can use for storage.
* bot_name = Give your bot a name. Call it whatever you please.
* bypassGMU = Array of ID's for events the bot should ignore
* defaultStaffChat = channel id of the staff channel. Not used at present.
* writeMessageToDrunkTank = True to message the drunk tank channel telling the user why, false if not.
* warnAuthorizedUsage = True to warn users for trying to command it with authorization, false if not.
* countedStrings = a list of strings that when the bot detects them as a message, keeps a count of the times the user has said the phrase
* countedJsonPath = Path to a local JSON file for the string counts (sips)

NB: Be careful with your access key. Keep it out of source control. I keep mine in .env and have it gitignored.

# License 

ISC License

You are free to use this as you please, however I take no responsibility for what you do with it and I won't provide any support.

Originally forked from: https://github.com/julianYaman/hello-world-discord-bot

Copyright 2021 Donald Carnegie
Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
