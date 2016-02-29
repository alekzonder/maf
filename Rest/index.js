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
    constructor(logger, app, config) {
        this._logger = logger;
        this._app = app;
        this._config = config;

        this._globalOptionsResponse = {
            title: this._config.title,
            description: this._config.description,
            resources: []
        };
    }

    /**
     * add new resource
     *
     * @param {Object} resource
     * @param {maf/Di} di
     * @return {Promise}
     */
    add(resource, di) {

        return new Promise((resolve, reject) => {

            if (!resource.resource) {
                reject(new Error('no resource in module'));
                return;
            }

            if (!resource.methods) {
                reject(new Error('no methods in module'));
                return;
            }

            var resourceUrl = this._getResourceUrl(resource.resource);

            this._globalOptionsResponse.resources.push({
                resource: resourceUrl,
                title: resource.title
            });

            var optionsResponse = {
                methods: {}
            };

            _.each(resource.methods, (methodData, method) => {

                if (!methodData.callback) {
                    var err = new Error('no callback in method ' + method + ' ' + resource.resource);
                    this._logger.error(err);
                    return;
                }

                var lcMethod = method.toLowerCase();

                if (!this._app[lcMethod]) {
                    var error = new Error(
                        'no method "' + lcMethod + '" in app for resource ' + method + ' ' + resource.resource
                    );

                    this._logger.error(error);
                    return;
                }

                var routeArgs = [];

                routeArgs.push(resourceUrl);

                var methodOptionsResponse = {
                    title: methodData.title
                };

                if (typeof methodData.schema == 'undefined') {
                    methodData.schema = {};
                }

                if (methodData.prehook && typeof methodData.prehook == 'function') {
                    methodData.prehook.call(methodData, di);
                }

                if (methodData.schema.path) {
                    methodOptionsResponse.path_vars = joiToJsonSchema(joi.object().keys(methodData.schema.path));
                }

                if (methodData.schema.query) {
                    routeArgs.push((req, res, next) => {

                        var joiOptions = {
                            convert: true,
                            abortEarly: false,
                            allowUnknown: false
                        };

                        var querySchema = methodData.schema.query;

                        querySchema.debug = joi.any();

                        joi.validate(req.query, querySchema, joiOptions, (err, data) => {

                            if (err) {
                                var list = [];

                                _.each(err.details, function(e) {

                                    list.push({
                                        message: e.message,
                                        path: e.path,
                                        type: e.type
                                    });

                                });

                                var e = new Error('invalid data');

                                e.code = 'invalid_data';
                                e.status = 400;
                                e.list = list;

                                res.badRequest(e);
                                return;
                            }

                            req.query = data;
                            next();
                        });
                    });

                    methodOptionsResponse.request = joiToJsonSchema(joi.object().keys(methodData.schema.query));
                }

                if (methodData.schema && methodData.schema.body) {
                    routeArgs.push((req, res, next) => {

                        var joiOptions = {
                            convert: true,
                            abortEarly: false,
                            allowUnknown: false
                        };

                        var bodySchema = methodData.schema.body;

                        bodySchema.debug = joi.any();

                        joi.validate(req.body, bodySchema, joiOptions, (err, data) => {

                            if (err) {
                                var list = [];

                                _.each(err.details, function(e) {

                                    list.push({
                                        message: e.message,
                                        path: e.path,
                                        type: e.type
                                    });

                                });

                                var e = new Error('invalid body');

                                e.code = 'invalid_data';
                                e.status = 400;
                                e.list = list;

                                res.badRequest(e);
                                return;
                            }

                            req.query = data;
                            next();
                        });
                    });

                    methodOptionsResponse.request = joiToJsonSchema(joi.object().keys(methodData.schema.body));
                }

                routeArgs.push(methodData.callback);

                this._app[lcMethod].apply(this._app, routeArgs);

                optionsResponse.methods[method] = methodOptionsResponse;
            });

            this._app.options(resourceUrl, (req, res) => {
                res.json(optionsResponse);
            });

            resolve();

        });
    }

    /**
     * init rest
     *
     * @return {express}
     */
    init() {
        this._app.options(this._config.baseUrl, (req, res) => {
            res.json(this._globalOptionsResponse);
        });

        return this._app;
    }

    /**
     * get resource url
     * @param  {String} url
     * @return {String}
     */
    _getResourceUrl(url) {

        if (this._config.baseUrl == '/') {
            return url;
        }

        return this._config.baseUrl + url;

    }
}

module.exports = Rest;
