'use strict';

var path = require('path');

var _ = require('lodash');

var ModelError = require(path.join(__dirname, '..', 'Error'));

var FindCursorChain = require(path.join(__dirname, 'FindCursorChain'));

var DebugTimer = require(path.join(__dirname, '..', '..', 'Debug', 'Timer'));

/**
 * @class
 * @abstract
 *
 * @see http://mongodb.github.io/node-mongodb-native/1.4/api-generated/
 */
class ModelTingodb {

    /**
     * @param  {mongodb} db
     */
    constructor (db) {
        this._db = db;
        this._collectionName = null;
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
     * ensureIndexes
     *
     * @return {Promise}
     */
    ensureIndexes () {

        return new Promise((resolve, reject) => {

            if (!this._indexes) {
                resolve({collection: this._collectionName, indexes: []});
                return;
            }

            var promises = [];

            _.each(this._indexes, (index) => {

                promises.push(new Promise((resolve, reject) => {

                    this._collection.ensureIndex(
                        index.fields,
                        index.options,
                        function (error, result) {
                            if (error) {
                                return reject(error);
                            }

                            resolve(result);
                        }
                    );

                }));

            });

            Promise.all(promises)
                .then((data) => {
                    resolve({collection: this._collectionName, indexes: data});
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
     * @param {Object} options
     * @return {Promise}
     */
    insertOne (data, options) {

        return new Promise((resolve, reject) => {

            var timer = this._createTimer('insertOne');

            if (data.id) {
                data._id = data.id;
            }

            timer.data = {
                collection: this._collectionName,
                data: data
            };

            this._collection.insert(data, options, (error, result) => {

                if (error) {
                    var e;

                    if (error.message && error.message === 'duplicate key error index') {
                        // already exists
                        e = new this.Error(
                            this.Error.CODES.ALREADY_EXISTS,
                            'document already exists'
                        );
                    } else {
                        e = this.Error.ensureError(error);
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
     * @param  {Object} options
     * @return {Object}
     */
    findOneAndUpdate (filter, update, options) {

        var timer = this._createTimer('findOneAndUpdate');

        var queryOptions = {
            new: true
        };

        if (options) {
            if (options.returnOriginal) {
                queryOptions.new = Boolean(options.returnOriginal);
            }
        }

        var sort = ['_id', 1];

        if (options && options.sort) {
            sort = ['_id', 1];
        }

        timer.data = {
            collection: this._collectionName,
            filter: filter,
            update: update,
            options: options
        };

        return new Promise((resolve, reject) => {
            this._collection.findAndModify(
                filter,
                sort,
                update,
                queryOptions,
                function (error, result) {
                    if (error) {
                        timer.error(error.message);
                        return reject(this.Error.ensureError(error));
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
    findOne (query, options) {
        return new Promise((resolve, reject) => {

            if (!options) {
                options = {};
            }

            var timer = this._createTimer('findOne');

            timer.data = {
                collection: this._collectionName,
                query: query,
                options: options
            };

            this._collection.findOne(query, options, function (error, result) {
                if (error) {
                    timer.error(error.message);
                    return reject(this.Error.ensureError(error));
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
     * @param {Object} options
     * @return {Promise}
     */
    findOneById (id, options) {
        return new Promise((resolve, reject) => {

            var timer = this._createTimer('findOneById');

            timer.data = {
                collection: this._collectionName,
                id: id,
                options: options
            };

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

        var chain = new FindCursorChain(
            this._collection,
            this._collectionName,
            filter,
            fields
        );

        chain.onExec((cursor, debugMessage) => {

            timer.message = debugMessage;

            return new Promise((resolve, reject) => {

                timer.stop();

                Promise.all([
                    new Promise((resolve, reject) => {
                        cursor.count(function (error, result) {
                            if (error) {
                                return reject(this.Error.ensureError(error));
                            }
                            resolve(result);
                        });
                    }),
                    new Promise((resolve, reject) => {
                        cursor.toArray(function (error, result) {
                            if (error) {
                                reject(this.Error.ensureError(error));
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
                collection: this._collectionName,
                filter: filter,
                data: data,
                options: options
            };

            this._collection.update(filter, data, options, (error, result) => {
                if (error) {
                    timer.error(error.message);
                    return reject(this.Error.ensureError(error));
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
     * @return {Promise}
     */
    remove (filter, options) {

        return new Promise((resolve, reject) => {
            var timer = this._createTimer('remove');

            timer.data = {
                collection: this._collectionName,
                filter: filter,
                options: options
            };

            this._collection.remove(filter, options, (error, result) => {
                if (error) {
                    timer.error(error.message);
                    return reject(this.Error.ensureError(error));
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
     * @return {Promise}
     */
    removeOne (filter, options) {

        if (!options) {
            options = {};
        }

        options.single = true;

        return this.remove(filter, options);

    }

    /**
     * count by filters
     *
     * @param  {Object} filter
     * @param  {Object} options
     * @return {Promise}
     */
    count (filter, options) {
        var timer = this._createTimer('count');

        timer.data = {
            collection: this._collectionName,
            filter: filter,
            options: options
        };

        return new Promise((resolve, reject) => {

            this._collection.count(filter, options, (error, result) => {
                if (error) {
                    timer.error(error.message);
                    return reject(this.Error.ensureError(error));
                }

                timer.stop();

                resolve(result);
            });
        });

    }

    /**
     * not implemented in Tingodb
     *
     * @return {Promise}
     */
    aggregate () {

        return new Promise((resolve, reject) => {
            reject(new this.Error('aggregate not implemented in Model/Tingodb'));
        });


    }

    /**
     * emit debug data
     *
     * @private
     * @param  {Object} data
     */
    _logDebug (data) {

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
    _createTimer (name) {
        var timer = new DebugTimer('tingo', name);

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

module.exports = ModelTingodb;
