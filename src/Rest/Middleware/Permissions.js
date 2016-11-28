
module.exports = () => {

    return {

        position: 'afterSchemaCheck',

        middleware: (req, res, next) => {

            if (req.di.config.private) {
                req.checkPermission = () => {
                    return new Promise((resolve) => {
                        resolve(true);
                    });
                };
            } else {
                req.checkPermission = (permission, params) => {

                    if (!req.user || !req.user.getGroup || typeof req.user.getGroup !== 'function') {

                        req.di.logger.error('no req.user for checkPermission helper');

                        return new Promise((resolve) => {
                            resolve(false);
                        });
                    }

                    return req.di.api.permissions.check(req.user.getGroup(), permission, params);
                };
            }

            next();

        }
    };
};
