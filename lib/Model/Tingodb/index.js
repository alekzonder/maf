'use strict';

var ModelError = require(__dirname + '/../Error');
var ModelErrorCodes = require(__dirname + '/../ErrorCodes');

var _ = require('lodash');

var FindCursorChain = require(__dirname + '/../FindCursorChain');

var DebugTimer = require(__dirname + '/../../Debug/Timer');

/**
 * @class
 * @abstract
 */
class TingodbModel {

    /**
     * @param  {Object} config
     * @param  {mongodb} db
     */
    constructor(db) {

        this.Error = ModelError;
        this.errorCodes = ModelErrorCodes;

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

            var timer = this._createTimer('insertOne');

            if (data.id) {
                data._id = data.id;
            }

            timer.message = `db.${this._collectionName}.insert(${this._json(data)})`;

            this._collection.insert(data, options, function (error, result) {

                if (error) {
                    var e;

                    if (error.message && error.message === 'duplicate key error index') {
                        e = new ModelError(
                            'record with id = ' + data.id + ' already exists',
                            ModelErrorCodes.ALREADY_EXISTS
                        );
                    } else {
                        e = error;
                    }

                    timer.error(e.message);

                    return reject(e);
                }

                timer.stop();

                if (result && result[0]) {
                    resolve(result[0]);
                } else {
                    resolve(null);
                }

            });

        });
    }

    /**
     * findOneAndUpdate
     *
     * @param  {Object} filter
     * @param  {Object} update
     * @param {Object} sort
     * @param  {Object} options
     * @return {Object}
     */
    findOneAndUpdate(filter, update, sort, options) {

        var timer = this._createTimer('findOneAndUpdate');

        var queryOptions = {
            new: true,
        };

        if (options) {
            if (options.returnOriginal) {
                queryOptions.new = Boolean(options.returnOriginal);
            }
        }

        if (!sort) {
            sort = ['_id', 1];
        }

        timer.message = `db.${this._collectionName} filter=${this._json(filter)} update=${this._json(update)} options=${this._json(options)}`;

        return new Promise((resolve, reject) => {
            this._collection.findAndModify(
                filter,
                sort,
                update,
                queryOptions,
                function (error, result) {
                    if (error) {
                        timer.error(error.message);
                        return reject(error);
                    }

                    timer.stop();

                    if (!result) {
                        return resolve(null);
                    }

                    resolve(result);
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

            if (!options) {
                options = {};
            }

            var timer = this._createTimer('findOne');
            timer.message = `db.${this._collectionName} query=${this._json(query)} options=${this._json(options)}`;

            this._collection.findOne(query, options, function (error, result) {
                if (error) {
                    timer.error(error.message);
                    return reject(error);
                }

                timer.stop();

                if (result) {
                    resolve(result);
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
    findOneById(id, options) {
        return new Promise((resolve, reject) => {

            var timer = this._createTimer('findOneById');
            timer.message = `db.${this._collectionName} id=${this._json(id)} options=${this._json(options)}`;

            this.findOne({_id: id})
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
                    reject(error);
                });

        });
    }

    /**
     * search by params
     *
     * @param  {Object} params
     * @param  {Object} fields
     * @return {Promise}
     */
    find(filter, fields) {

        var timer = this._createTimer('find');

        var chain = new FindCursorChain(this._collection, filter, fields);

        chain.onExec((cursor, debugMessage) => {

            timer.message = debugMessage;

            return new Promise((resolve, reject) => {

                timer.stop();

                Promise.all([
                    new Promise((resolve, reject) => {
                        cursor.count(function (error, result) {
                            if (error) {
                                return reject(error);
                            }
                            resolve(result);
                        });
                    }),
                    new Promise((resolve, reject) => {
                        cursor.toArray(function (error, result) {
                            if (error) {
                                return reject(error);
                            }
                            resolve(result);
                        });
                    })
                ])
                    .then((data) => {

                        resolve({
                            total: data[0],
                            docs: data[1]
                        });

                    })
                    .catch((error) => {
                        timer.error(error.message);
                        reject(error);
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
     * @return {Promise}
     */
    update(filter, data, options) {

        return new Promise((resolve, reject) => {
            var timer = this._createTimer('update');
            timer.message = `db.${this._collectionName} filter=${this._json(filter)} data=${this._json(data)} options=${this._json(options)}`;

            this._collection.update(filter, data, options, function (error, result) {
                if (error) {
                    timer.error(error.message);
                    return reject(error);
                }

                timer.stop();

                resolve(result);
            });
        });
    }

    /**
     * remove
     *
     * @param  {Object} filter
     * @param {Object} options
     *
     * @return {Promise}
     */
    remove(filter, options) {

        return new Promise((resolve, reject) => {
            var timer = this._createTimer('remove');
            timer.message = `db.${this._collectionName} filter=${this._json(filter)} options=${this._json(options)}`;

            this._collection.remove(filter, options, function (error, result) {
                if (error) {
                    timer.error(error.message);
                    return reject(error);
                }

                timer.stop();

                resolve(result);
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
    removeOne(filter, options) {

        if (!options) {
            options = {};
        }

        options.single = true;

        return this.remove(filter, options);

    }

    /**
     * get cound by filters
     *
     * @param  {Object} filter
     * @param  {Object} options
     * @return {Promise}
     */
    count(filter, options) {
        var timer = this._createTimer('count');
        timer.message = `db.${this._collectionName} filter=${this._json(filter)} options=${this._json(options)}`;

        return new Promise((resolve, reject) => {

            this._collection.count(filter, options, function (error, result) {
                if (error) {
                    timer.error(error.message);
                    return reject(error);
                }

                timer.stop();

                resolve(result);
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

        return new Promise((resolve, reject) => {
            reject(new Error('aggregate not implemented in Model/Tingodb'));
        });


    }

    /**
     * emit debug data
     *
     * @private
     * @param  {Object} data
     */
    _logDebug(data) {

        if (!this._debugger || !this._debugger.log) {
            return;
        }

        this._debugger.log(data);
    }

    /**
     * create debug timer
     *
     * @private
     * @param  {String} name
     * @return {DebugTimer}
     */
    _createTimer(name) {
        var timer = new DebugTimer('mongo', name);

        timer.onStop((data) => {
            this._logDebug(data);
        });

        return timer;
    }

    /**
     * json helper
     *
     * @private
     * @param  {Object} data
     * @return {String}
     */
    _json(data) {
        return JSON.stringify(data);
    }


}

module.exports = TingodbModel;
