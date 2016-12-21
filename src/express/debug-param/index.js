module.exports = function () {

    return function (req, res, next) {
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
    };

};
