var path = require('path');

var Di = require(path.resolve(__dirname + '/../../Di'));
var RequestDebug = require(path.resolve(__dirname + '/../../Request/Debug'));

module.exports = function (init) {

    return function (logger, config, originalDi) {

        return new Promise((resolve, reject) => {

            var di = new Di();

            di.config = config;

            di.logger = logger;

            Promise.resolve()
                .then(() => {

                    if (originalDi) {
                        di.debug = new RequestDebug();
                        di.setConnections(originalDi.getConnections());
                    } else if (init.db) {
                        return init.db(config, di);
                    }

                })
                .then(() => {
                    return init.models(config, di);
                })
                .then((models) => {
                    di.models = models;
                    return init.api(config, models, di);
                })
                .then((api) => {
                    di.api = api;
                    resolve(di);
                })
                .catch((error) => {
                    reject(error);
                });

        });

    };

};
