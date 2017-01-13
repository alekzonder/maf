var log4js = require('log4js-nested');

module.exports = function (name, logLevel) {

    if (logLevel) {
        log4js.setGlobalLogLevel(logLevel);
    }
    
    var logger = log4js.getLogger(name);
    return logger;
};
