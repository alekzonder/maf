var fs = require('fs');
var path = require('path');

var ConfigError = require(path.resolve(`${__dirname}/Error`));

module.exports = function (logger, options) {

    return new Promise((resolve, reject) => {

        if (!options.configPath) {
            return reject(
                new ConfigError(ConfigError.CODES.NO_CONFIG_PATH)
            );
        }

        var configPath = process.env.CONFIG ? process.env.CONFIG : options.configPath;

        if (!fs.existsSync(configPath)) {
            logger.debug(`fs: config file not found ${configPath}`);

            return reject(
                ConfigError.createError(ConfigError.CODES.NO_CONFIG, {path: configPath})
            );
        }

        logger.info(`fs: found config ${configPath}`);

        resolve(require(configPath));
    });

};
