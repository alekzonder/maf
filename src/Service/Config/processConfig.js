module.exports = function (logger, options, config) {

    return new Promise((resolve) => {

        logger.trace('process config');

        if (process.env.HOST) {
            config.host = process.env.HOST;
        }

        if (process.env.PORT) {
            config.port = process.env.PORT;
        }

        if (process.env.PRIVATE) {
            config.private = true;
        }

        config.NODE_ENV = (process.env.NODE_ENV) ? process.env.NODE_ENV : 'production';

        resolve(config);

    });

};
