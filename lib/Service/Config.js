var fs = require('fs');

module.exports = function (defaultConfigPath) {

    var configPath = process.env.CONFIG ? process.env.CONFIG : defaultConfigPath;

    return new Promise((resolve, reject) => {

        if (!fs.existsSync(configPath)) {
            reject(new Error('no config: ' + configPath));
            return;
        }

        var config = require(configPath);

        if (process.env.HOST) {
            config.host = process.env.HOST;
        }

        if (process.env.PORT) {
            config.port = process.env.PORT;
        }

        if (process.env.PRIVATE) {
            config.private = true;
        }

        resolve(config);
    });

};
