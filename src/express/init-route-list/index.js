module.exports = function (app) {

    app.get('/_service/express/routes', function (req, res) {

        var routes = [];

        for (var layer of app._router.stack) {
            if (!layer.route || !layer.route.path) {
                continue;
            }

            routes.push({
                path: layer.route.path,
                methods: Object.keys(layer.route.methods)
            });

        }

        res.json({result: routes});

    });

};
