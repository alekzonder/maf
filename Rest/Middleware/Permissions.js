var joi = require('joi');

module.exports = (logger, di) => {

    return {

        position: 'afterSchemaCheck',

        middleware: (req, res, next) => {

            if (req.di.config.private) {
                req.checkPermission = (permission, params) => {
                    return new Promise((resolve) => {
                        resolve(true);
                    });
                };
            } else {
                req.checkPermission = (permission, params) => {

                    if (!req.user || !req.user.group) {

                        req.di.logger.error('no req.user for checkPermission helper');

                        return new Promise((resolve, reject) => {
                            resolve(false);
                        });
                    }

                    return di.api.permissions.check(req.user.group, permission, params);
                };
            }

            next();

        }
    };
};
