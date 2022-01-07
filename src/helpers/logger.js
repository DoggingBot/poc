var moment = require("moment");
// use moment, it's so much faster and cleaner
function log(msg) {
    console.log(moment().format('YYYY-MM-DD_HH:mm:ss:') + msg);
}

exports.log = log;