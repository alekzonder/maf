'use strict';

var _ = require('lodash');
var joi = require('joi');
var joiToJsonSchema = require('joi-to-json-schema');

/**
 * @class
 */
class Rest {

    /**
     * constructor
     *
     * @param  {log4js} logger
     * @param  {express} app
     * @param  {Object} config
     */
    constructor (logger, app, config) {
        this._logger = logger;
        this._app = app;
        this._config = config;

        this._globalOptionsResponse = {
            title: this._config.title,
            description: this._config.description,
            resources: []
        };

        this._middlewares = [];
    }

    /**
     * add rest middleware
     *
     * @param {Object} middleware
     */
    addMiddleware (middleware) {
        // TODO check
        this._middlewares.push(middleware);
    }

    /**
     * add new resource
     *
     * @param {Object} resource
     * @param {maf/Di} di
     * @return {Promise}
     */
    add (resource, di) {

        return new Promise((resolve, reject) => {

            if (!resource.resource) {
                reject(new Error('no resource in module'));
                return;
            }

            if (!resource.methods) {
                reject(new Error('no methods in module'));
                return;
            }

            if (!resource.title) {
                resource.title = '-';
            }

            var resourceUrl = this._getResourceUrl(resource.resource);

            let optionsResponse = {
                methods: {}
            };

            _.each(resource.methods, (methodData, method) => {

                if (!methodData.callback) {
                    var err = new Error(`no callback in method ${method} ${resource.resource}`);
                    this._logger.error(err);
                    return;
                }

                var lcMethod = method.toLowerCase();

                if (!this._app[lcMethod]) {
                    var error = new Error(
                        `no method "${lcMethod}" in app for resource ${method} ${resource.resource}`
                    );

                    this._logger.error(error);
                    return;
                }

                var routeArgs = [];

                routeArgs.push(resourceUrl);

                routeArgs.push((req, res, next) => {
                    req.rest = methodData;
                    next();
                });

                var methodOptionsResponse = {
                    title: methodData.title
                };

                if (typeof methodData.schema === 'undefined') {
                    methodData.schema = {};
                }

                if (methodData.prehook && typeof methodData.prehook === 'function') {
                    methodData.prehook(methodData, di);
                }

                // duplicate
                if (methodData.preHook && typeof methodData.preHook === 'function') {
                    methodData.preHook(methodData, di);
                }

                if (methodData.disabled) {
                    return;
                }

                if (methodData.onlyPrivate && !di.config.private) {
                    return;
                }

                var middlewares = {
                    afterSchemaCheck: []
                };

                var middlewaresAfterSchemaCheck = [];

                if (this._middlewares) {

                    _.each(this._middlewares, (middleware) => {

                        if (['afterSchemaCheck'].indexOf(middleware.position) === -1) {
                            var e = new Error(
                                `unknown maf/Rest middleware position: ${middleware.position}`
                            );

                            this._logger.fatal(e);
                            return reject(e);
                        }

                        var checkResult = false;

                        if (typeof middleware.check === 'undefined') {
                            checkResult = true;
                        } else if (typeof middleware.check === 'function') {
                            checkResult = middleware.check(methodData);
                        } else {
                            checkResult = Boolean(middleware.check);
                        }

                        if (checkResult) {

                            if (middleware.prepare) {
                                methodData = middleware.prepare(method, methodData);
                            }

                            middlewares[middleware.position].push(middleware.middleware);
                        }

                    });
                }

                if (methodData.schema.path) {
                    methodOptionsResponse.path_vars = joiToJsonSchema(
                        (methodData.schema.path.isJoi) ?
                            methodData.schema.path :
                            joi.object().keys(methodData.schema.path)
                    );
                }

                if (methodData.schema.query) {
                    routeArgs.push((req, res, next) => {

                        var joiOptions = {
                            convert: true,
                            abortEarly: false,
                            allowUnknown: false
                        };

                        var querySchema = methodData.schema.query;

                        joi.validate(req.query, querySchema, joiOptions, (err, data) => {

                            if (err) {

                                var list = [];

                                _.each(err.details, function (e) {

                                    list.push({
                                        message: e.message,
                                        path: e.path,
                                        type: e.type
                                    });

                                });

                                var e = new Error('invalid data');

                                e.code = 'invalidData';
                                e.status = 400;
                                e.list = list;

                                res.sendCtxNow().badRequest(e);
                                return;
                            }

                            req.query = data;
                            next();
                        });
                    });

                    methodOptionsResponse.request = joiToJsonSchema(
                        (methodData.schema.query.isJoi) ?
                            methodData.schema.query :
                            joi.object().keys(methodData.schema.query)
                    );

                }

                if (methodData.schema && methodData.schema.body) {
                    routeArgs.push((req, res, next) => {

                        var joiOptions = {
                            convert: true,
                            abortEarly: false,
                            allowUnknown: false
                        };

                        var bodySchema = methodData.schema.body;

                        joi.validate(req.body, bodySchema, joiOptions, (err, data) => {

                            if (err) {
                                var list = [];

                                _.each(err.details, function (e) {

                                    list.push({
                                        message: e.message,
                                        path: e.path,
                                        type: e.type
                                    });

                                });

                                var e = new Error('invalid body');

                                e.code = 'invalidData';
                                e.status = 400;
                                e.list = list;

                                res.sendCtxNow().badRequest(e);
                                return;
                            }

                            req.query = data;
                            next();
                        });
                    });

                    methodOptionsResponse.request = joiToJsonSchema(
                        methodData.schema.body.isJoi ?
                            methodData.schema.body :
                            joi.object().keys(methodData.schema.body)
                    );
                }

                if (middlewares.afterSchemaCheck.length) {

                    _.each(middlewares.afterSchemaCheck, (m) => {
                        routeArgs.push(m);
                    });

                }

                routeArgs.push((req, res, next) => {

                    res.ctxDone = () => {
                        next();
                    };

                    methodData.callback(req, res);

                });

                routeArgs.push((req, res, next) => {

                    if (!res.ctx) {
                        res.sendCtxNow().notFound('resource not found', 'resource_not_found');
                        return;
                    }

                    res.ctx.body.debug = {
                        time: (res._startTime) ? (new Date().getTime() - res._startTime) : null
                    };

                    if (req._debug && res.ctx) {
                        res.ctx.body.debug.log = req.di.debug.get();
                    }

                    res.sendCtx();
                });

                this._app[lcMethod].apply(this._app, routeArgs);

                optionsResponse.methods[method] = methodOptionsResponse;
            });

            if (_.keys(optionsResponse.methods).length) {

                this._globalOptionsResponse.resources.push({
                    resource: resource.resource,
                    title: resource.title
                });

                this._app.options(resourceUrl, (req, res) => {
                    res.json(optionsResponse);
                });

            } else {
                this._logger.info(`${resource.resource} disabled`);
            }

            resolve();

        });
    }

    /**
     * add resources
     *
     * @param {Array} resources
     * @param {maf/Di} di
     * @return {Promise}
     */
    addMany (resources, di) {
        return new Promise((resolve, reject) => {

            var promises = [];

            _.each(resources, (resource) => {
                promises.push(this.add(resource, di));
            });

            Promise.all(promises)
                .then(() => {
                    resolve();
                })
                .catch((error) => {
                    reject(error);
                });

        });
    }

    /**
     * init rest
     *
     * @return {express}
     */
    init () {
        this._app.options(this._config.baseUrl, (req, res) => {
            res.json(this._globalOptionsResponse);
        });

        return this._app;
    }

    /**
     * get resource url
     *
     * @private
     * @param  {String} url
     * @return {String}
     */
    _getResourceUrl (url) {

        if (this._config.baseUrl === '/') {
            return url;
        }

        return this._config.baseUrl + url;

    }
}

module.exports = Rest;
