'use strict';

var os = require('os');
var path = require('path');

var _ = require('lodash');

var getConfigFromFile = require(path.resolve(`${__dirname}/getConfigFromFile`));
var getConfigFromConsul = require(path.resolve(`${__dirname}/getConfigFromConsul`));
var processConfig = require(path.resolve(`${__dirname}/processConfig`));
var validateConfig = require(path.resolve(`${__dirname}/validateConfig`));

var ConfigError = require(path.resolve(`${__dirname}/Error`));

/**
 * service configuration from consul or json file
 *
 * @see http://consul.io
 */
class ServiceConfig {

    /**
     * @constructor
     * @param {logger} logger
     * @param {Object} options
     */
    constructor (logger, options) {
        this._logger = logger;

        this.Error = ConfigError;

        this._options = {};

        if (options) {
            this._options = options;
        }

        this._config = null;
    }

    /**
     * load config
     *
     * @return {Promise}
     */
    load () {
        return new Promise((resolve, reject) => {

            getConfigFromConsul(this._logger, this._options)
                .then((config) => {
                    if (!config) {
                        return getConfigFromFile(this._logger, this._options);
                    }

                    return config;
                })
                .then((config) => {
                    return processConfig(this._logger, this._options, config);
                })
                .then((config) => {
                    if (this._options.schema) {
                        this._logger.debug('validate config by schema');

                        return validateConfig(
                            this._logger,
                            config,
                            this._options.schema
                        );
                    }

                    return config;
                })
                .then((config) => {
                    this._config = config;
                    this._config.service = {
                        hostname: os.hostname()
                    };
                    resolve();
                })
                .catch((error) => {
                    reject(ConfigError.ensureError(error));
                });

        });
    }

    /**
     * get config using lodash get method
     *
     * @param  {String} name
     * @param  {*} defaultValue
     * @return {*}
     */
    get (name, defaultValue) {
        if (typeof defaultValue === 'undefined') {
            defaultValue = null;
        }

        return _.get(this._config, name, defaultValue);
    }

    /**
     * return full config object
     *
     * @return {Object}
     */
    toObject () {
        return JSON.parse(JSON.stringify(this._config));
    }

}

module.exports = ServiceConfig;
