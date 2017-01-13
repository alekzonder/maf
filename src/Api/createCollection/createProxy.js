var path = require('path');

var CollectionError = require(path.join(__dirname, '..', 'CollectionError'));

module.exports = function (logger, di, apiClasses, createFunctions) {


    var original = {
        di: di,
        Error: CollectionError,
        apiClasses: apiClasses,
        createFunctions: createFunctions,
        api: {}
    };

    logger.debug('create proxy to api object');

    var proxy = new Proxy(original, {

        get: function (target, name/*, receiver*/) {

            // typeof name === 'symbol'
            if (typeof name !== 'string') {
                return target;
            }

            name = String(name);

            if (['then', 'catch'].indexOf(name) > -1) {
                return null;
            }

            if (!target.apiClasses[name]) {
                throw new target.Error(target.Error.CODES.UNKNOWN_API).bind({name: name});
            }

            if (!target.api[name]) {

                var createFn = target.createFunctions.default;

                if (typeof target.createFunctions[name] === 'function') {
                    createFn = target.createFunctions[name];
                }

                target.api[name] = createFn(target.di, target.apiClasses[name]);
            }

            return target.api[name];

        },

        // has: function (target, name) {
        //     console.log(name);
        //     if (target.apiClasses[name]) {
        //         return true;
        //     }
        //
        //     return false;
        // },

        ownKeys: function (target) {
            return Object.keys(target.apiClasses);
        },

        isExtensible: function () {
            return false;
        },

        preventExtensions: function () {
            return false;
        },

        defineProperty: function () {
            return false;
        },

        deleteProperty: function () {
            return false;
        }

    });

    logger.debug('api proxy created');

    return proxy;

};
