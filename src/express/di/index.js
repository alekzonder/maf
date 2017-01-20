module.exports = function (logger, di, initDiFn) {

    return function (req, res, next) {

        if (req._debug === true) {

            di.logger.trace('req._debug === true');

            initDiFn(di.logger, di.config, di)
                .then((di) => {
                    req.di = di;
                    next();
                })
                .catch((error) => {
                    logger.error(error);
                    res.serverError();
                    next();
                });

            return;

        } else {
            req.di = di;
            next();
        }

    };
};
