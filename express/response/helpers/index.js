module.exports = function(options) {

    var continueRequestProcessing = false;

    if (options && options.continue) {
        continueRequestProcessing = true;
    }

    return function(req, res, next) {

        res.sendCtxImmediately = continueRequestProcessing;

        res.serverError = function() {

            this.ctx = {
                status: 500,
                body: {
                    error: {
                        message: 'Server Error',
                        code: 'server_error'
                    }
                }
            };

            if (this.sendCtxImmediately) {
                this.sendCtx();
            } else {
                this.ctxDone();
            }

        };

        res.notFound = function(message, code) {

            this.ctx = {
                status: 404,
                body: {
                    error: {
                        message: message,
                        code: code
                    }
                }
            };

            if (this.sendCtxImmediately) {
                this.sendCtx();
            } else {
                this.ctxDone();
            }

        };

        res.result = function(data, metadata) {

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

        res.badRequest = function(error) {

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

            if (this.sendCtxImmediately) {
                this.sendCtx();
            } else {
                this.ctxDone();
            }
        };

        res.forbidden = function (message, code) {
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

            if (this.sendCtxImmediately) {
                this.sendCtx();
            } else {
                this.ctxDone();
            }
        };

        res.sendCtxNow = function () {
            this.sendCtxImmediately = true;
            return this;
        };

        res.sendCtx = function() {

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
