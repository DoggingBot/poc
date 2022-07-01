async function handle(message) {
    // break up the message and locate an existing url
    let m = message.content.split(" ");
    let link = false;
    m.forEach((s,i) => {
        let r = s.split('https://');
        if (r.length > 1) {
            link = r[1].split("/")[0];
        }
    });
    if (link) {
        var t = HELPERS.fakeLinks.testFakeLink(link);
        if (t) {
            // log the link, then remove it, DM the offending user about it, then return back true;
            SERVICES.guildService.writeToChannel("logChannel", HELPERS.messages.fakeLinkReport(link, message));
            message.author.send(
                "Your account was caught posting a fake/scam link in our server. You may be a victim of a discord phishing scam." +
                "\r\n\r\nPlease secure your account by changing your password, and consider adding 2FA. By changing your password, all other logged-in devices will be kicked out of your account." + 
                "\r\n\r\nAlso, ensure your email account is also secured, as phishers like these tend to attack emails as well, and if you use the same password (and don't use any 2FA), your email is also likely compromised. It also wouldn't hurt to run a malware scan on the device you had followed the phishing link on." +
                "\r\n\r\nLastly, please be more careful in the future, scam links are easy to spot and verify, especially nitro scams due to the missing 'accept gift' button in the link embed."
            ).catch((e) => {
                HELPERS.logger.log(e + " - Fake link posted by " + message.author.tag + " (" + message.author.id + ")");
            });
            tankee = await SERVICES.guildService.getMemberFromCache(message.author.id);
            bot = await SERVICES.guildService.getMemberFromCache(message.client.user.id);
            tankStaff = false; // set to true if bot becomes capable of tanking staff roles
            
            // If the user has an Admin role, we can't remove the role nor can we tank them. Just tag the Admins/botMaster and move on.
            if (tankee.permissions.has(1 << 3)) {
                await SERVICES.guildService.writeToChannel('modlogChannel',
                  "<@&" + CONFIG.servers[message.guild.id].botMasterRole +
                  "> <@&753411885470318695>:\r\n<@" + tankee.user.id + "> posted a scam link! They might be compromised.", true); // hard-coded Druncord's Admin until I decide to store the Admin role in CONFIG
                tankStaff = false;
            } else {
                /* DISABLED until bot can tank staff roles
                if (tankee._roles.includes(CONFIG.servers[message.guild.id].botUserRole) || tankee._roles.includes(CONFIG.servers[message.guild.id].modUserRole)) {
                    tankStaff = true;
                    await SERVICES.guildService.writeToChannel('modlogChannel',
                      "<@&" + CONFIG.servers[message.guild.id].modUserRole + ">" +
                      "\r\n<@" + tankee.user.id + "> posted a scam link! They might be compromised.", true);
                }
                */
            }

            await SERVICES.drunkTankService.tankUser(message.guild.id, tankee, bot, "Fake/Scam link", 36500, "days", tankStaff)
            .then(async(tanked)=>{
                if (tanked) {
                    setTimeout(() => {
                        SERVICES.guildService.writeToChannel('tankChannel', "Secure your account... and you'll have to verify you are no longer compromised", false);
                    }, 11000);
                }
            })
            .then(()=>{
                message.delete({reason: "Fake/Scam link detected"});
                return true;
            });
        }
    }
    // did not match a link or did not contain a link, return false
    return false;
}

exports.handle = handle;