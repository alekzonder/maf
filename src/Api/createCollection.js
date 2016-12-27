module.exports = function (di, apiClasses, createFn) {

    return new Promise((resolve/* , reject */) => {

        var api = {};

        di.api = api;

        for (var name in apiClasses) {

            api[name] = createFn(di, apiClasses[name]);

            if (di.debug && api[name].setDebug) {
                api[name].setDebug(di.debug);
            }

        }

        api.createTest = () => {

            return new Promise((resolve, reject) => {
                api.checks.createTest()
                    .then(() => {
                        resolve();
                    })
                    .catch((error) => {
                        reject(error);
                    });
            });

        };

        resolve(api);

    });

};
