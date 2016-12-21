module.exports = function () {
    return function (req, res, next) {
        res._startTime = new Date().getTime();
        next();
    };
};
