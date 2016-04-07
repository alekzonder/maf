var joi = require('joi');

module.exports = (logger, di) => {

    var checkToken = true;

    if (di.config.private) {
        logger.warn('starting PRIVATE mode, no auth check for all resources');
        checkToken = false;
    } else {
        logger.info('add maf/Rest/Middleware/AuthToken');
    }

    return {

        position: 'afterSchemaCheck',

        check: function(methodData) {
            return (methodData && methodData.checkAuthToken) ? true : false;
        },

        prepare: function(method, methodData) {

            if (!checkToken) {
                return methodData;
            }

            if (method == 'GET') {
                if (!methodData.schema.query) {
                    methodData.schema.query = {};
                }

                methodData.schema.query.authToken = joi.string().required().description('auth token');
            } else {
                if (!methodData.schema.body) {
                    methodData.schema.body = {};
                }

                methodData.schema.body.authToken = joi.string().required().description('auth token');
            }

            return methodData;
        },

        middleware: (req, res, next) => {

            var di = req.di;

            var promise;

            if (checkToken) {
                if (!di.api || !di.api.authTokens || !di.api.authTokens.check) {
                    logger.fatal('no valid di.api.authTokens for AuthToken middleware');
                    return res.sendCtxNow().serverError();
                }

                var authToken = null;

                if (req.query && req.query.authToken) {
                    authToken = req.query.authToken;
                } else if (req.body && req.body.authToken) {
                    authToken = req.body.authToken;
                }

                if (!authToken) {
                    return res.sendCtxNow().forbidden('no auth_token', 'no_auth_token');
                }

                promise = di.api.authTokens.check(authToken);

                promise
                    .then((token) => {
                        return di.api.users.getById(token.userId);
                    })
                    .then((user) => {
                        req.user = user;

                        delete req.query.authToken;
                        delete req.body.authToken;

                        req.checkPermission = (permission, params) => {
                            return di.api.rbac.check(req.user.group, permission, params);
                        };

                        next();
                    });

            } else {
                promise = new Promise((resolve) => {
                    req.user = null;

                    req.checkPermission = (permission, params) => {
                        return new Promise((resolve) => {
                            resolve(true);
                        });
                    };

                    next();
                });
            }

            promise
                .catch((error) => {
                    var errorCodes = di.api.authTokens.errorCodes;

                    var validUserErrorCodes = [
                        errorCodes.INVALID_DATA,
                        errorCodes.INVALID_AUTH_TOKEN,
                        errorCodes.TOKEN_EXPIRED
                    ];

                    if (
                        error instanceof di.api.authTokens.ApiError &&
                        validUserErrorCodes.indexOf(error.code) > -1
                    ) {
                        res.sendCtxNow().forbidden(error.message, error.code);
                    } else {
                        di.logger.error(error);
                        res.sendCtxNow().serverError();
                    }
                });
        }
    };
};
