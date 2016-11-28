var _ = require('lodash');

module.exports = function (options) {

    var continueRequestProcessing = false;

    if (options && options.continue) {
        continueRequestProcessing = true;
    }

    return function (req, res, next) {

        res.sendCtxImmediately = !continueRequestProcessing;

        var helpers = {};

        helpers.logServerError = function (error) {
            var logErrorFn = _.get(req, 'di.logger.error');

            if (error && logErrorFn && _.isFunction(logErrorFn)) {
                req.di.logger.error(error);
            }

            this.serverError();
        };

        helpers.serverError = function () {

            this.ctx = {
                status: 500,
                body: {
                    error: {
                        message: 'Server Error',
                        code: 'serverError'
                    }
                }
            };

            if (this.sendCtxImmediately) {
                this.sendCtx();
            } else {
                this.ctxDone();
            }

        };

        helpers.notFound = function (message, code, entity) {

            if (message instanceof Error) {
                var error = message;
                message = error.message;
                code = error.code;
                entity = error.entity;
            }

            this.ctx = {
                status: 404,
                body: {
                    error: {
                        message: message,
                        code: code
                    }
                }
            };

            if (entity) {
                this.ctx.body.error.entity = entity;
            }

            if (this.sendCtxImmediately) {
                this.sendCtx();
            } else {
                this.ctxDone();
            }

        };

        helpers.result = function (data, metadata) {

            var response = {};

            if (metadata) {
                response.metadata = metadata;
            }

            response.result = data;

            this.ctx = {
                status: 200,
                body: response
            };

            if (this.sendCtxImmediately) {
                this.sendCtx();
            } else {
                this.ctxDone();
            }

        };

        helpers.badRequest = function (error) {

            var message = 'Bad Request';
            var code = null;
            var list = [];

            if (error.message) {
                message = error.message;
            }

            if (error.code) {
                code = error.code;
            }

            if (error.list) {
                list = error.list;
            }

            this.ctx = {
                status: 400,
                body: {
                    error: {
                        message: message,
                        code: code,
                        list: list
                    }
                }
            };

            if (error.entity) {
                this.ctx.body.error.entity = error.entity;
            }

            if (this.sendCtxImmediately) {
                this.sendCtx();
            } else {
                this.ctxDone();
            }
        };

        helpers.forbidden = function (message, code, entity) {

            if (message instanceof Error) {
                var error = message;

                message = error.message;
                code = error.code;
                entity = error.entity;
            }

            message = (message) ? message : 'Forbidden';
            code = (code) ? code : 'forbidden';

            this.ctx = {
                status: 403,
                body: {
                    error: {
                        message: message,
                        code: code
                    }
                }
            };

            if (entity) {
                this.ctx.body.error.entity = entity;
            }

            if (this.sendCtxImmediately) {
                this.sendCtx();
            } else if (this.ctxDone) {
                this.ctxDone();
            } else {
                throw new Error('no ctxDone for response');
            }
        };

        // binding helpers to res object
        _.each(helpers, (helper, name) => {
            res[name] = _.bind(helper, res);
        });

        res.sendCtxNow = function () {
            this.sendCtxImmediately = true;
            return this;
        };

        res.sendCtx = function () {

            if (!this.ctx) {
                this.status(500).json({
                    error: {
                        message: 'Server Error',
                        code: 'no_response_context'
                    }
                });
            }

            if (this.ctx.status) {
                this.status(this.ctx.status);
            }

            if (this.ctx.body) {
                this.json(this.ctx.body);
            } else {
                this.json();
            }
        };

        next();
    };

};
