var joi = require('joi');

var ServiceConfig = require('../../../src/Service/Config');

var logger = require('log4js-nested').getLogger('service');

var options = {
    configPath: '/data/etc/config.json',
    consul: {
        key: 'test',
        timeout: 5
    },
    schema: {
        host: joi.string().allow(null),
        port: joi.number().integer().required()
    }
};

var config = new ServiceConfig(logger, options);

config.load()
    .then(() => {
        logger.info(config.toObject());
    })
    .catch((error) => {

        var failover = function (error) {
            logger.error(error);
        };

        if (!error.checkable) {
            return failover();
        }

        error.getCheckChain(failover, logger)
        .ifCode(config.Error.CODES.CONSUL_TIMEOUT, function () {
            logger.error(error);
        })
        .ifCode(config.Error.CODES.CONSUL_ECONNREFUSED, function () {
            logger.error('consul unreachable');
        })
        .check();

    });
