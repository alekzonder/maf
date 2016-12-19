var os = require('os');
var path = require('path');

var _ = require('lodash');
var request = require('superagent');

var ConfigError = require(path.resolve(`${__dirname}/Error`));

/**
 * get key form consul kv api
 *
 * @param  {logger} logger
 * @param  {String} key
 * @param  {Object} options
 * @private
 * @return {Promise}
 */
var getConsulKey = function (logger, key, options) {

    return new Promise((resolve, reject) => {
        var url = `http://${options.host}:${options.port}/v1/kv/${key}`;

        logger.trace(`GET ${url}`);

        request.get(url)
            .timeout(options.timeout)
            .then((res) => {
                logger.trace(`GET ${url} - 200`);
                resolve(res.body);
            })
            .catch((error) => {
                logger.trace(`GET ${url} - ${error.status}`);

                if (error.status === 404) {
                    return resolve(null);
                }

                var code = ConfigError.CODES.UNKNOWN_ERROR;

                if (error.code === 'ECONNREFUSED') {
                    code = ConfigError.CODES.CONSUL_ECONNREFUSED;
                } else if (
                    error.code === 'ECONNABORTED' &&
                    typeof error.timeout === 'number'
                ) {
                    code = ConfigError.CODES.CONSUL_TIMEOUT;
                }

                var exception = ConfigError.createError(code, error);

                exception.bind({method: 'GET', url: url});

                reject(exception);
            });

    });

};


/**
 * load config from consul
 *
 * @param  {logger} logger
 * @param  {Object} options
 * @return {Promise}
 */
module.exports = function (logger, options) {

    return new Promise((resolve, reject) => {
        if (!options.consul || !options.consul.key) {
            return resolve(null);
        }

        if (!options.consul.timeout) {
            options.consul.timeout = 100;
        }

        if (!options.consul.host) {
            options.consul.host = 'localhost';
        }

        if (!options.consul.port) {
            options.consul.port = 8500;
        }

        var key = options.consul.key;

        var hostConfigKey = `${key}:${os.hostname()}`;

        logger.debug(`consul: get host service config by key="${hostConfigKey}"`);

        Promise.all([
            getConsulKey(logger, hostConfigKey, options.consul),
            getConsulKey(logger, key, options.consul)
        ])
            .then((result) => {

                var raw = null;

                if (result[0]) {
                    logger.info(`consul: found config in key ${hostConfigKey}`);
                    raw = result[0];
                } else if (result[1]) {
                    logger.info(`consul: found config in key ${key}`);
                    raw = result[1];
                } else {
                    logger.warn(`consul: no config in keys = ${hostConfigKey}, ${key}`);
                    return resolve(null);
                }

                logger.trace('consul: get raw config', raw);

                var objectPath = '0.Value';

                var rawValue = _.get(raw, objectPath, null);

                logger.trace(`consul: get config key = ${objectPath}`, rawValue);

                if (!rawValue) {
                    return resolve(null);
                }

                var decoded = new Buffer(raw[0].Value, 'base64').toString('ascii');

                logger.trace(`consul: decoded value ${decoded}`);

                var config = JSON.parse(decoded);

                logger.trace(`consul: parsed value`, config);

                resolve(config);

            })
            .catch((rawError) => {
                var error = ConfigError.ensureError(rawError);

                if (ConfigError.is(ConfigError.CODES.CONSUL_ECONNREFUSED, error)) {
                    logger.error(error);
                    resolve(null);
                } else {
                    reject(error);
                }
            });

    });

};
