module.exports = function () {

    return function (req, res) {
        res.sendCtxNow().notFound('resource not found', 'resource_not_found');
    };

};
