var path = require('path');

var CollectionError = require(path.join(__dirname, '..', 'Error'));

module.exports = function (logger, createFunctions) {

    return new Promise((resolve, reject) => {

        if (
            !createFunctions ||
            (
                typeof createFunctions !== 'function' &&
                typeof createFunctions.default !== 'function'
            )
        ) {
            logger.debug('invalid createFunctions object');

            return reject(
                new CollectionError(
                    CollectionError.CODES.INVALID_CREATE_FUNCTIONS_PARAM
                )
            );
        }

        logger.debug('valid createFunctions object');

        resolve();
    });

};
