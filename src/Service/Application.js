var path = require('path');
var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');

var init = {
    nprof: require('nprof/express/register'),
    expressRouteList: require(path.resolve(__dirname, '../express/init-route-list'))
};

var middlewares = {
    startTime: require(path.resolve(__dirname, '../express/start-time')),
    responseHelpers: require(path.resolve(__dirname, '../express/response/helpers')),
    debugParam: require(path.resolve(__dirname, '../express/debug-param')),
    di: require(path.resolve(__dirname, '../express/di')),
    requestId: require(path.resolve(__dirname, '../express/request/id'))
};

module.exports = function (di, config) {

    process.on('unhandledRejection', (error) => {
        di.logger.fatal(error);
    });

    process.on('uncaughtException', (error) => {
        di.logger.fatal(error);
    });

    process.on('rejectionHandled', (error) => {
        di.logger.fatal(error);
    });

    var app = express();

    app.di = di;

    app.disable('x-powered-by');
    app.disable('etag');

    app.use(middlewares.requestId());

    init.expressRouteList(app);

    app.use(middlewares.startTime());

    app.use(cors({
        preflightContinue: true,
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']
    }));

    app.use(middlewares.responseHelpers({
        continue: true
    }));

    app.use(bodyParser.json({
        type: '*/*'
    }));

    if (config && config.bodyParser && bodyParser.urlencoded) {
        app.use(bodyParser.urlencoded({
            extended: false
        }));
    }

    app.use(require('../express/body-parser/json-error')(di.logger));

    app.use(middlewares.debugParam());

    var initDiFn = null;

    if (
        config && config.requestDebug &&
        typeof config.requestDebug.initDiFn === 'function'
    ) {
        initDiFn = config.requestDebug.initDiFn;
    }

    app.use(middlewares.di(di.logger, di, initDiFn));

    init.nprof(di.logger, app, di.config.nprof);

    return app;

};
