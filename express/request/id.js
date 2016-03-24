var uuid = require('uuid');

module.exports = function () {

    return function (req, res, next) {
        var requestId = `${uuid.v4()}-${new Date().getTime()}`;
        req.id = requestId;
        res.set('X-Request-Id', requestId);
        next();
    };

};
