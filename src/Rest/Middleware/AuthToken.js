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

        check: function (methodData) {
            return (methodData && methodData.checkAuthToken) ? true : false;
        },

        prepare: function (method, methodData) {

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

                di.api.authTokens.check(authToken)
                    .then((token) => {
                        delete req.query.authToken;
                        delete req.body.authToken;

                        req.user.setId(token.userId);

                        next();
                    })
                    .catch((error) => {
                        var ec = {
                            authTokens: di.api.authTokens.errorCodes
                        };

                        res.sendCtxNow();

                        if (!error.checkable) {
                            return res.logServerError(error);
                        }

                        var chain = error.getCheckChain(res.logServerError);

                        chain.ifEntity('authToken')
                            .ifCode(ec.authTokens.INVALID_DATA, res.forbidden)
                            .ifCode(ec.authTokens.TOKEN_EXPIRED, res.forbidden)
                            .ifCode(ec.authTokens.INVALID_AUTH_TOKEN, res.forbidden);

                        chain.check();

                    });

            } else {
                next();
            }

        }
    };
};
