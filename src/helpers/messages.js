function confirm_message(authorNickname, tankTaggedString, reason, drunktankRole, roles) {
    return authorNickname + 
    "\r\nCommanded me to drunk tank " + tankTaggedString +
    "\r\nWith Reason: " + reason +
    "\r\nI have removed all their roles: " + roles +
    "\r\nI have granted: " + drunktankRole;
}
function confirm_untank_message(authorNickname, tankTaggedString, reason, rolesGivenBack) {
    return authorNickname + 
    "\r\nCommanded me to untank " + tankTaggedString +
    "\r\nWith Reason: " + reason +
    "\r\nI have removed 2Drunk2Party, and returned their original roles: " + rolesGivenBack;
}
function log_blue_tank_msg(authorNickname, tankTaggedString, tankedUsername, tankedUserID, reason) {
    return "=== DRUNK TANKED ===" +
    "\r\Tag: " + tankTaggedString +
    "\r\nUsername: " + tankedUsername +
    "\r\nId: " + tankedUserID +
    "\r\nDrunk tanked by " + authorNickname +
    reason != undefined ? "\r\nReason: " + reason : "";
}
function log_blue_untank_msg(authorNickname, tankTaggedString, tankedUsername, tankedUserID, datediff) {
    return "=== UNTANKED ===" +
    "\r\Tag: " + tankTaggedString +
    "\r\nUsername: " + tankedUsername +
    "\r\nId: " + tankedUserID +
    "\r\nUntanked by " + authorNickname +
    "\r\nThey were in the tank for " + datediff;
}
function tank_msg(authorNickname, tankTaggedString, reason, duration, uom) {
    return tankTaggedString + "," +
    "\r\nYou were drunk tanked by " + authorNickname + 
    "\r\nReason: " + reason + 
    "\r\nYou are here for " + duration + " " + uom 
}

exports.confirm_untank_message = confirm_untank_message;
exports.confirm_message = confirm_message;
exports.log_blue_untank_msg = log_blue_untank_msg;
exports.log_blue_tank_msg = log_blue_tank_msg;
exports.tank_msg = tank_msg;