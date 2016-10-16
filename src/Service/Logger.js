var log4js = require('log4js-nested');

module.exports = function (name) {
    var logger = log4js.getLogger(name);
    return logger;
};
