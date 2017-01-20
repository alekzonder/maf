module.exports = function (logger) {

    var log = function (error) {
        if (logger && typeof logger.error === 'function') {
            logger.error(error);
        } else {
            console.log(error);
        }
    };

    process.on('unhandledRejection', function (error) {
        log(error);
        process.exit(1);
    });

    process.on('uncaughtException', function (error) {
        log(error);
        process.exit(1);
    });

    process.on('rejectionHandled', function (error) {
        log(error);
        process.exit(1);
    });

};
