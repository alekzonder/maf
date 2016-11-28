var ContextUser = require('../Context/User');

module.exports = () => {

    return {

        position: 'afterSchemaCheck',

        middleware: (req, res, next) => {
            req.user = new ContextUser();
            next();
        }
    };
};
