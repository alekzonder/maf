var path = require('path');

var joi = require('joi');

var ConfigError = require(path.resolve(`${__dirname}/Error`));

module.exports = function (logger, config, schema) {

    return new Promise((resolve, reject) => {

        var joiOptions = {
            convert: true,
            abortEarly: false,
            allowUnknown: true
        };

        joi.validate(config, schema, joiOptions, (error, valid) => {
            if (error) {

                var code = null;

                if (error.name === 'ValidationError') {
                    code = ConfigError.CODES.INVALID_CONFIG;
                }

                return reject(ConfigError.createError(code, error));
            }

            resolve(valid);
        });
    });

};
