module.exports = function (di, modelClasses, createFn) {

    return new Promise((resolve/* , reject */) => {

        var models = {};

        for (var name in modelClasses) {

            var model = createFn(di, modelClasses[name]);

            model.init();

            if (di.debug && model.setDebugger) {
                model.setDebugger(di.debug);
            }

            models[name] = model;

        }

        models.ensureIndexes = function () {
            var promises = [];

            for (var name in models) {

                var model = models[name];

                if (model.ensureIndexes && typeof model.ensureIndexes === 'function') {
                    promises.push(model.ensureIndexes());
                }

            }

            return Promise.all(promises);
        };

        resolve(models);

    });

};
