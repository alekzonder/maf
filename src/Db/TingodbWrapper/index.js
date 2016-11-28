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
