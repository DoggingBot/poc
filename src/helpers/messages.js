var moment = require('moment');
const HELPERS = require('./helpers');

function confirm_tank_message(author, tankedMember, reason, drunktankRole, roles) {
    return author.displayName +
    "\r\nCommanded me to drunk tank " + tankedMember.displayName +
    "\r\nWith Reason: " + reason +
    "\r\nI have removed all their roles: " + roles +
    "\r\nI have granted: " + drunktankRole;
}
function confirm_untank_message(author, tankedMember, reason, drunktankRole, rolesGivenBack) {
    return author.displayName + 
    "\r\nCommanded me to untank " + tankedMember.displayName +
    "\r\nWith Reason: " + reason +
    "\r\nI have removed " + drunktankRole + ", and returned their original roles: " + rolesGivenBack;
}
function log_blue_tank_msg(author, tankedMember, reason, roles, disconnectedFromVc) {
    return "=== DRUNK TANKED ===" +
    "\r\Tag: <@" + tankedMember.id + ">" +
    "\r\nUsername: " + tankedMember.user.tag +
    "\r\nId: " + tankedMember.id +
    "\r\nDrunk tanked by <@" + author.id + "> (" + author.user.tag + ") (" + author.id + ")" +
    (disconnectedFromVc ? "\r\nI disconnected the member from VC" : "") +
    "\r\nReason: " + reason;
}
function log_blue_untank_msg(author, tankedUser, reason, datediff) {
    return "=== UNTANKED ===" +
    "\r\Tag: <@" + tankedUser.id + ">" +
    "\r\nUsername: " + tankedUser.user.tag +
    "\r\nId: " + tankedUser.id +
    "\r\nUntanked by <@" + author.id + "> (" + author.user.tag + ") (" + author.id + ")" +
		"\r\nReason: " + reason;
    "\r\nThey were in the tank for " + datediff;
}
function tank_msg(author, tankedMember, reason, duration, uom) {
    return "<@" + tankedMember.id + ">," +
    "\r\nYou were drunk tanked by " + author.displayName + 
    "\r\nReason: " + reason + 
    "\r\nYou are here for " + duration + " " + uom 
}

function user_leave_msg(oldMember, invite) {
		return "<@" + oldMember.id + "> (" + oldMember.user.tag + ") (" + oldMember.id + ") **LEFT**" +
		"\r\nInvited by " + (invite !== null ? "<@" + invite.inviter + "> (" + invite.inviter + ") with code **" + invite.code + "**" : "-Unknown-") +
		"\r\nThe user account was created " + moment(oldMember.user.createdAt).format("MMM D, YYYY @ HH:mm:ss UTC") + " (" + HELPERS.getDateDiffString(Date.now(), oldMember.user.createdAt) + " ago)" +
		"\r\nThe user was in the server for " + (oldMember.joinedTimestamp !== "unknown" ? HELPERS.getDateDiffString(Date.now(), oldMember.joinedTimestamp) : "an unknown time (needs manual lookup)") +
    "\r\n" + oldMember.leaveReason;
		
}

function user_join_msg(member, invite) {
		return "<@" + member.id + "> (" + member.user.tag + ") (" + member.id + ") JOINED" +
		"\r\nInvited by " + (invite !== null ? "<@" + invite.inviter + "> (" + invite.inviter + ") with code **" + invite.code + "**" : "-Unknown-") +
		"\r\nThe user account was created " + moment(member.user.createdAt).format("MMM D, YYYY @ HH:mm:ss UTC") + " (" + HELPERS.getDateDiffString(Date.now(), member.user.createdAt) + " ago)";
}

function user_name_change_msg(oldMember, namechange, change) {
		return "<@" + oldMember.id + "> (" + oldMember.id + ")\r\n" +
			" - Change: " + namechange +
			" - Old: " + change.o + "\r\n" +
			" - New: " + change.n;
}

function log_role_change(author, newMember, role, auditAction) {
	if (auditAction === '$add') {
		return "<@" + author.id + "> (" + author.user.tag + ") (" + author.id + ") gave <@&" + role + "> to <@" + newMember.id + "> (" + newMember.user.tag + ") (" + newMember.id + ").";
	}
	if (auditAction === '$remove') {
		return "<@" + author.id + "> (" + author.user.tag + ") (" + author.id + ") took <@&" + role + "> from <@" + newMember.id + "> (" + newMember.user.tag + ") (" + newMember.id + ").";
	}
	return "<@" + author.id + "> (" + author.user.tag + ") (" + author.id + ") modified somehow <@&" + role + "> from <@" + newMember.id + "> (" + newMember.user.tag + ") (" + newMember.id + ") (AuditLog entry missing)";
	
}

exports.confirm_untank_message = confirm_untank_message;
exports.confirm_tank_message = confirm_tank_message;
exports.log_blue_untank_msg = log_blue_untank_msg;
exports.log_blue_tank_msg = log_blue_tank_msg;
exports.tank_msg = tank_msg;
exports.user_leave_msg = user_leave_msg;
exports.user_join_msg = user_join_msg;
exports.user_name_change_msg = user_name_change_msg;
exports.log_role_change = log_role_change;