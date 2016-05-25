var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');

module.exports = function(di, config) {

    var app = express();

    app.di = di;

    app.disable('x-powered-by');
    app.disable('etag');

    app.use(cors({
        preflightContinue: true,
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']
    }));

    app.use(require('../express/response/helpers')({continue: false}));

    app.use(bodyParser.json({type: '*/*'}));

    if (config && config.bodyParser && bodyParser.urlencoded) {
        app.use(bodyParser.urlencoded({extended: false}));
    }

    app.use(require('../express/body-parser/json-error')());

    app.use(require('../express/request/id')());

    // detect _debug
    app.use((req, res, next) => {

        if (req.query.debug) {
            delete req.query.debug;
        }

        if (req.body && req.body.debug) {
            delete req.body.debug;
        }

        if (typeof req.query._debug != 'undefined') {
            delete req.query._debug;
            req._debug = true;
        }

        next();

    });

    return app;

};
