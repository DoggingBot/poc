require('dotenv').config();

const drunktankRole = "892918061940736081";
const tankChannel = "892922617114267678";
const logChannel = "892922537900642315";
const botMasterRole = "892918139208212480";
const serverID = "880917338839470100";
const tankUOM = "hours";
const tankDuration = "12";
const commandPrefix = ".";
const access_key = process.env.druncord_access_key;
const json_path = "flatfiles/tankees.json";
const bot_name = "Druncord Warden";
const bypassGMU = ['840370023108968448','756311071836340316'];//Bot itself, druncord
const rolesToIgnore = ['756711648160645172']; //Roles that we do not try to remove or give
const rolesICannotTank = []; //Roles that we cannot command
const defaultStaffChat = "880917340508782604";
const writeMessageToDrunkTank = false;
const warnAuthorizedUsage = false;
const countedStrings = ['sip'];
const countedJsonPath = 'flatfiles/sipcount.json';


exports.drunktankRole = drunktankRole
exports.tankChannel = tankChannel
exports.logChannel = logChannel
exports.botMasterRole = botMasterRole
exports.tankUOM = tankUOM
exports.tankDuration = tankDuration
exports.commandPrefix = commandPrefix
exports.access_key = access_key
exports.json_path = json_path
exports.bot_name = bot_name
exports.serverID = serverID
exports.bypassGMU = bypassGMU
exports.defaultStaffChat = defaultStaffChat
exports.writeMessageToDrunkTank = writeMessageToDrunkTank;
exports.warnAuthorizedUsage = warnAuthorizedUsage;
exports.countedStrings = countedStrings;
exports.countedJsonPath = countedJsonPath;
exports.rolesICannotTank = rolesICannotTank;
exports.rolesToIgnore = rolesToIgnore;