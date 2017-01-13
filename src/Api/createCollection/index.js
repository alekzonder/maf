var path = require('path');

var CollectionError = require(path.join(__dirname, '..', 'Error'));

var validateCreateFunctions = require(path.join(__dirname, 'validateCreateFunctions'));
var createApiProxy = require(path.join(__dirname, 'createProxy'));

module.exports = function (di, apiClasses, createFunctions) {

    return new Promise((resolve, reject) => {

        var logger = di.logger.getLogger('api');

        validateCreateFunctions(logger, createFunctions)
            .then(() => {

                if (typeof createFunctions === 'function') {
                    createFunctions = {
                        default: createFunctions
                    };
                }

                var api = createApiProxy(logger, di, apiClasses, createFunctions);

                resolve(api);
            })
            .catch((error) => {
                reject(CollectionError.ensureError(error));
            });

    });

};
