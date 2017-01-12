'use strict';

var path = require('path');

var ModelError = require(path.join(__dirname, '..', 'Error'));

var FindCursorChain = require(path.join(__dirname, 'FindCursorChain'));

var DebugTimer = require(path.join(__dirname, '..', '..', 'Debug', 'Timer'));

/**
 * @class
 * @abstract
 */
class ModelMongodb {

    /**
     * @param  {mongodb} db
     * @param {String} collectionName
     */
    constructor (db, collectionName) {
        this._db = db;
        this._collectionName = collectionName;
        this._indexes = null;
        this._collection = null;

        this._debug = null;

        this.Error = ModelError;
    }

    /**
     * set debugger object
     *
     * @param {Request/Debug} debug
     */
    setDebug (debug) {
        this._debug = debug;
    }

    /**
     * init collection of model
     *
     * @return {Promise}
     */
    init () {

        if (!this._collectionName) {
            throw new this.Error(this.Error.CODES.NO_COLLECTION_NAME);
        }

        this._collection = this._db.collection(this._collectionName);

        return this;
    }

    /**
     * ensure collection indexes
     *
     * @return {Promise}
     */
    ensureIndexes (/* options */) {

        return new Promise((resolve, reject) => {

            if (!this._indexes) {
                resolve({collection: this._collectionName, indexes: []});
                return;
            }

            var existsPromises = [];

            for (var i in this._indexes) {

                if (i in this._indexes === false) {
                    throw new this.Error(
                        this.Error.CODES.INVALID_ENSURE_INDEXES,
                        'no index data for index ' + i
                    );
                }

                var index = this._indexes[i];

                if ('options' in index === false || 'name' in index.options === false) {
                    throw new this.Error(
                        this.Error.CODES.INVALID_ENSURE_INDEXES,
                        'no options.name for index ' + i
                    );
                }

                existsPromises.push(
                    this._collection.indexExists(index.options.name)
                );

            }

            Promise.all(existsPromises)
                .then((data) => {
                    var createPromises = [];

                    for (var key in data) {

                        if (key in data === false) {
                            console.log('not key ' + key + ' in ensureIndexes result');
                            continue;
                        }

                        var exists = data[key];

                        if (!exists) {
                            createPromises.push(
                                this._collection.createIndex(
                                    this._indexes[key].fields,
                                    this._indexes[key].options
                                )
                            );
                        }
                    }

                    if (!createPromises.length) {
                        resolve({collection: this._collectionName, indexes: []});
                        return;
                    }

                    Promise.all(createPromises)
                        .then((data) => {
                            resolve({collection: this._collectionName, indexes: data});
                        })
                        .catch((error) => {
                            reject(this.Error.ensureError(error));
                        });

                })
                .catch((error) => {
                    reject(this.Error.ensureError(error));
                });


        });

    }

    /**
     * insert new one
     *
     * @param  {Object} data
     * @return {Promise}
     */
    insertOne (data/*, options*/) {

        return new Promise((resolve, reject) => {

            var timer = this._createTimer('insertOne');

            if (data.id) {
                data._id = data.id;
            }

            timer.data = {
                collection: this._collection.namespace,
                data: data
            };

            this._collection.insertOne(data)
                .then((result) => {
                    timer.stop();

                    if (result.ops && result.ops[0]) {
                        resolve(result.ops[0]);
                    } else {
                        resolve(null);
                    }
                })
                .catch((error) => {
                    if (error) {
                        var e;

                        if (error.code && error.code === 11000) {
                            // already exists
                            e = new this.Error(
                                this.Error.CODES.ALREADY_EXISTS,
                                'document already exists'
                            );
                        } else {
                            e = this.Error.ensureError(error);
                        }

                        timer.error(e.message);

                        reject(e);
                        return;
                    }
                });

        });
    }

    /**
     * findOneAndUpdate
     *
     * @param  {Object} filter
     * @param  {Object} update
     * @param  {Object} options
     * @return {Object}
     */
    findOneAndUpdate (filter, update, options) {

        var timer = this._createTimer('findOneAndUpdate');

        if (!options) {
            options = {
                returnOriginal: false
            };

        } else if (typeof options.returnOriginal === 'undefined') {
            options.returnOriginal = false;
        }

        timer.data = {
            collection: this._collection.namespace,
            filter: filter,
            update: update,
            options: options
        };

        return new Promise((resolve, reject) => {
            this._collection.findOneAndUpdate(filter, update, options)
                .then((data) => {
                    timer.stop();

                    /*
                        data = {
                            value: { _id: 1, id: 1, name: '100' },
                            lastErrorObject: { updatedExisting: true, n: 1 },
                            ok: 1
                        }
                    */

                    if (data.value) {
                        resolve(data.value);
                    } else {
                        resolve(null);
                    }

                })
                .catch((error) => {
                    timer.error(error.message);
                    reject(this.Error.ensureError(error));
                });
        });


    }

    /**
     * get one
     *
     * @param  {Object} query
     * @param {Object} options
     * @return {Promise}
     */
    findOne (query, options) {
        return new Promise((resolve, reject) => {

            var timer = this._createTimer('findOne');

            timer.data = {
                collection: this._collection.namespace,
                query: query,
                options: options
            };

            this._collection.findOne(query, options)
                .then((doc) => {
                    timer.stop();
                    if (doc) {
                        resolve(doc);
                    } else {
                        resolve(null);
                    }
                })
                .catch((error) => {
                    timer.error(error.message);
                    reject(this.Error.ensureError(error));
                });
        });
    }

    /**
     * get one by id
     *
     * @param  {String} id
     * @param {Object} options
     * @return {Promise}
     */
    findOneById (id, options) {
        return new Promise((resolve, reject) => {

            var timer = this._createTimer('findOneById');

            timer.data = {
                collection: this._collection.namespace,
                id: id,
                options: options
            };

            this._collection.findOne({_id: id})
                .then((doc) => {
                    timer.stop();

                    if (doc) {
                        resolve(doc);
                    } else {
                        resolve(null);
                    }
                })
                .catch((error) => {
                    timer.error(error.message);
                    reject(this.Error.ensureError(error));
                });

        });
    }

    /**
     * search by params
     *
     * @param  {Object} filter
     * @param  {Object} fields
     * @return {Promise}
     */
    find (filter, fields) {

        var timer = this._createTimer('find');

        fields = this._prepareFields(fields);

        var chain = new FindCursorChain(this._collection, filter, fields, timer);

        chain.onExec((cursor) => {

            return new Promise((resolve, reject) => {

                timer.stop();

                Promise.all([cursor.count(), cursor.toArray()])
                    .then((data) => {

                        resolve({
                            total: data[0],
                            docs: data[1]
                        });

                    })
                    .catch((error) => {
                        timer.error(error.message);
                        reject(this.Error.ensureError(error));
                    });

            });

        });

        return chain;
    }

    /**
     * update
     *
     * @param  {Object} filter
     * @param  {Object} data
     * @param  {Object} options
     * @return {Promise}
     */
    update (filter, data, options) {

        return new Promise((resolve, reject) => {

            var timer = this._createTimer('update');

            timer.data = {
                collection: this._collection.namespace,
                filter: filter,
                data: data,
                options: options
            };

            var promise;

            if (options && options.multi) {
                promise = this._collection.updateMany(filter, data, {});
            } else {
                promise = this._collection.updateOne(filter, data, {});
            }

            promise
                .then((result) => {
                    timer.stop();

                    /*
                       result = {result: { ok: 1, nModified: 0, n: 0 }, connection: {...}};
                     */

                    resolve(result.result.n);
                })
                .catch((error) => {
                    timer.error(error.message);
                    reject(this.Error.ensureError(error));
                });

        });

    }

    /**
     * remove docs
     *
     * @param {Object} filter
     * @param {Object} options
     * @return {Promise}
     */
    remove (filter, options) {

        return new Promise((resolve, reject) => {
            var timer = this._createTimer('remove');

            timer.data = {
                collection: this._collection.namespace,
                filter: filter,
                options: options
            };

            this._collection.remove(filter, options)
                .then((data) => {
                    timer.stop();
                    /*
                    {
                        ok: data.result.ok,
                        count: data.result.n
                    }
                     */
                    resolve(data.result.n);
                })
                .catch((error) => {
                    timer.error(error.message);
                    reject(this.Error.ensureError(error));
                });

        });

    }

    /**
     * remove one
     *
     * @param  {Object} filter
     * @param {Object} options
     *
     * @return {Promise}
     */
    removeOne (filter, options) {
        var timer = this._createTimer('removeOne');

        timer.data = {
            collection: this._collection.namespace,
            filter: filter,
            options: options
        };

        return new Promise((resolve, reject) => {
            this._collection.remove(filter, {single: true})
                .then((data) => {
                    timer.stop();
                    resolve(data.result.n);
                })
                .catch((error) => {
                    timer.error(error.message);
                    reject(this.Error.ensureError(error));
                });
        });

    }

    /**
     * get cound by filters
     *
     * @param  {Object} filter
     * @param  {Object} options
     * @return {Promise}
     */
    count (filter, options) {
        var timer = this._createTimer('count');

        timer.data = {
            collection: this._collection.namespace,
            filter: filter,
            options: options
        };

        return new Promise((resolve, reject) => {

            this._collection.count(filter)
                .then((data) => {
                    timer.stop();
                    resolve(data);
                })
                .catch((error) => {
                    timer.error(error.message);
                    reject(this.Error.ensureError(error));
                });

        });

    }

    /**
     * aggregate
     *
     * @param  {Object} pipeline
     * @param  {Object} options
     * @return {AggregationCursor}
     */
    aggregate (pipeline, options) {
        var timer = this._createTimer('aggregate');

        timer.data = {
            collection: this._collection.namespace,
            filter: pipeline,
            options: options
        };

        timer.stop();

        return this._collection.aggregate(pipeline, options);
    }

    /**
     * emit debug data
     *
     * @private
     * @param  {Object} data
     */
    _logDebug (data) {

        if (!this._debug || !this._debug.log) {
            return;
        }

        this._debug.log(data);
    }

    /**
     * create debug timer
     *
     * @private
     * @param  {String} name
     * @return {DebugTimer}
     */
    _createTimer (name) {
        var timer = new DebugTimer('mongo', name);

        timer.onStop((data) => {
            this._logDebug(data);
        });

        return timer;
    }

    /**
      * prepare fields
      *
      * @param  {Object} fields
      * @return {Object}
      */
    _prepareFields (fields) {
        var result = {};

        if (!fields) {
            return null;
        }

        if (Array.isArray(fields)) {
            for (var name of fields) {
                result[name] = 1;
            }
        } else if (typeof fields === 'object') {
            result = fields;
        } else {
            throw this.Error(this.Error.CODES.INVALID_FIELDS_FORMAT);
        }

        return result;
    }

}

module.exports = ModelMongodb;
