var joi = require('joi');
var ContextUser = require('../Context/User');

module.exports = (logger, di) => {

    return {

        position: 'afterSchemaCheck',

        middleware: (req, res, next) => {
            req.user = new ContextUser();
            next();
        }
    };
};
