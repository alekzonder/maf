function promisifyCollection (collection) {
    var methods = ['insert'];

    for (var method of methods) {

        if (typeof collection[method] === 'function') {

            collection['_o_' + method] = collection[method];

            collection[method] = function () {

                var that = this;

                var args = [];

                for (var v of arguments) {
                    args.push(v);
                }

                return new Promise(function (resolve, reject) {

                    args.push(null);

                    args.push(function (err, result) {

                        if (err) {
                            return reject(err);
                        }

                        resolve(result);
                    });

                    collection['_o_' + method].apply(collection, args);
                });

            };

        }

    }

    return collection;
}

var makeArgs = function (a) {
    var args = [];

    for (var v of a) {
        args.push(v);
    }

    return args;
};

var promisifyInsert = function (collection) {

    var oName = '_o_insert';

    collection[oName] = collection.insert;

    collection.insertOne = function () {
        var args = makeArgs(arguments);

        while (args.length != 2) {
            args.push(null);
        }

        return new Promise(function (resolve, reject) {

            args.push(function (err, result) {
                if (err) {
                    if (err.message == 'duplicate key error index') {
                        err.code = 11000;
                    }
                    return reject(err);
                }

                resolve({
                    insertedCount: 1,
                    ops: result
                });

            });

            collection[oName].apply(collection, args);
        });

    };

    return collection;
};

module.exports = function (db) {

    db._o_collection = db.collection;

    db.collection = function () {
        var collection = this._o_collection.apply(this, arguments);

        collection = promisifyInsert(collection);

        return collection;
    };

    return db;

};