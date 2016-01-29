"use strict";

var ModelError = require('./Error');
var ModelErrorCodes = require('./ErrorCodes');
var _ = require('lodash');

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

    ensureIndexes() {

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
    insertOne(data) {

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

            this._collection.findOne(query, options, (err, doc) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (doc) {
                    resolve(doc);
                } else {
                    resolve(null);
                }
            });
        });
    }

    /**
     * get one by id
     *
     * @param  {String} id
     * @return {Promise}
     */
    findOneById(id) {
        return new Promise((resolve, reject) => {
            this._collection.findOne({
                _id: id
            }, (err, doc) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (doc) {
                    resolve(doc);
                } else {
                    resolve(null);
                }
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
    find(filter, fields, sort, limit, offset) {

        return new Promise((resolve, reject) => {

            var cursor = this._collection.find(filter);

            if (fields) {
                cursor.project(fields);
            }

            if (sort) {
                cursor.sort(sort);
            }

            if (limit) {
                cursor.limit(limit);
            }

            if (offset) {
                cursor.skip(offset);
            }

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

    }

    /**
     * update one
     *
     * @param  {Object} filters
     * @param  {Object} data
     * @return {Promise}
     */
    updateOne(filters, data) {

        return new Promise((resolve, reject) => {
            this._collection.update(filters, data, {}, (err, num) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(data);
            });
        });
    }


    /**
     * remove one
     *
     * @param  {Object} filters
     * @return {Promise}
     */
    removeOne(filters) {
        return new Promise((resolve, reject) => {
            this._collection.remove(filters, {}, (err, count) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(count);
            });
        });
    }

    /**
     * get cound by filters
     *
     * @param  {Object} filters
     * @return {Promise}
     */
    count(filters) {

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

}


module.exports = ModelAbstract;
