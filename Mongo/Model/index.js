"use strict";

var ModelError = require('./Error');
var ModelErrorCodes = require('./ErrorCodes');
var _ = require('lodash');

var FindCursorChain = require('./FindCursorChain');

var DebugTimer = require('../../Debug/Timer');

/**
 * @class
 * @abstract
 */
class ModelAbstract {

    /**
     * @param  {Object} config
     * @param  {mongodb} db
     */
    constructor(db) {
        this._db = db;
        this._collectionName = null;
        this._indexes = null;
        this._collection = null;

        this._debugger = null;
    }

    /**
     * set debugger object
     *
     * @param {Request/Debug} debugger
     */
    setDebugger(__debugger) {
        this._debugger = __debugger;
    }

    /**
     * init collection of model
     *
     * @return {Promise}
     */
    init() {

        if (!this._collectionName) {

            throw new ModelError(
                'no collection name for model',
                ModelErrorCodes.NO_COLLECTION_NAME
            );

        }

        this._collection = this._db.collection(this._collectionName);

        return this;
    }

    ensureIndexes(options) {

        return new Promise((resolve, reject) => {

            if (!this._indexes) {
                resolve([]);
                return;
            }

            var existsPromises = [];

            _.each(this._indexes, (index) => {
                existsPromises.push(this._collection.indexExists(index.options.name));
            });

            Promise.all(existsPromises)
                .then((data) => {
                    var createPromises = [];

                    _.each(data, (exists, key) => {

                        if (!exists) {
                            createPromises.push(
                                this._collection.createIndex(
                                    this._indexes[key].fields,
                                    this._indexes[key].options
                                )
                            );
                        }

                    });

                    if (!createPromises.length) {
                        resolve([]);
                        return;
                    }

                    Promise.all(createPromises)
                        .then((data) => {
                            resolve(data);
                        })
                        .catch((error) => {
                            reject(error);
                        });

                })
                .catch((error) => {
                    reject(error);
                });


        });

    }

    /**
     * insert new one
     *
     * @param  {Object} data
     * @return {Promise}
     */
    insertOne(data, options) {

        return new Promise((resolve, reject) => {

            if (data.id) {
                data._id = data.id;
            }

            this._collection.insertOne(data)
                .then((result) => {
                    if (result.ops && result.ops[0]) {
                        resolve(result.ops[0]);
                    } else {
                        resolve(null);
                    }
                })
                .catch((error) => {
                    if (error) {
                        var e;

                        if (error.code && error.code == 11000) {
                            // already exists
                            e = new ModelError(
                                'record with id = ' + data.id + ' already exists',
                                ModelErrorCodes.ALREADY_EXISTS
                            );
                        } else {
                            e = error;
                        }

                        reject(e);
                        return;
                    }
                });

        });
    }

    findOneAndUpdate(filter, update, options) {

        if (!options) {

            options = {
                returnOriginal: false
            };

        } else if (typeof options.returnOriginal == 'undefined') {
            options.returnOriginal = false;
        }

        return new Promise((resolve, reject) => {
            this._collection.findOneAndUpdate(filter, update, options)
                .then((data) => {
                    resolve(data);
                })
                .catch((error) => {
                    reject(error);
                });
        });


    }

    /**
     * get one
     *
     * @param  {Object} query
     * @param {Object} options
     *
     * @return {Promise}
     */
    findOne(query, options) {
        return new Promise((resolve, reject) => {

            this._collection.findOne(query, options)
                .then((doc) => {
                    if (doc) {
                        resolve(doc);
                    } else {
                        resolve(null);
                    }
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    /**
     * get one by id
     *
     * @param  {String} id
     * @return {Promise}
     */
    findOneById(id, options) {
        return new Promise((resolve, reject) => {

            this._collection.findOne({_id: id})
                .then((doc) => {
                    if (doc) {
                        resolve(doc);
                    } else {
                        resolve(null);
                    }
                })
                .catch((err) => {
                    reject(err);
                });

        });
    }

    /**
     * search by params
     *
     * @param  {Object} params
     * @param  {Object} fields
     * @param  {Object} sort
     * @param  {Number} limit
     * @param  {Number} offset
     * @return {Promise}
     */
    find(filter, fields, sort, limit, offset, options) {

        var timer = this._createTimer('find');

        var chain = new FindCursorChain(this._collection, filter, fields);

        chain.onExec((cursor, debugMessage) => {

            timer.message = debugMessage;

            return new Promise((resolve, reject) => {

                this._logDebug(timer.stop());

                Promise.all([cursor.count(), cursor.toArray()])
                    .then((data) => {

                        resolve({
                            total: data[0],
                            docs: data[1]
                        });

                    })
                    .catch((error) => {
                        reject(error);
                    });

            });

        });

        return chain;
    }

    /**
     * update one
     *
     * @param  {Object} filters
     * @param  {Object} data
     * @return {Promise}
     */
    updateOne(filters, data, options) {

        return new Promise((resolve, reject) => {
            this._collection.update(filters, data, {})
                .then((num) => {
                    resolve(data);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }


    /**
     * remove one
     *
     * @param  {Object} filters
     * @return {Promise}
     */
    removeOne(filters, options) {

        return new Promise((resolve, reject) => {
            this._collection.remove(filters, {})
                .then((count) => {
                    resolve(count);
                })
                .catch((err) => {
                    reject(err);
                });
        });

    }

    /**
     * get cound by filters
     *
     * @param  {Object} filters
     * @return {Promise}
     */
    count(filters, options) {

        return new Promise((resolve, reject) => {

            this._collection.count(filters)
                .then((data) => {
                    resolve(data);
                })
                .catch((error) => {
                    reject(error);
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
    aggregate(pipeline, options) {
        return this._collection.aggregate(pipeline, options);
    }

    /**
     * emit debug data
     *
     * @param  {Object} data
     */
    _logDebug(data) {

        if (!this._debugger || !this._debugger.log) {
            return;
        }

        this._debugger.log(data);
    }

    _createTimer(name) {
        return new DebugTimer('mongo', name);
    }


}

module.exports = ModelAbstract;
