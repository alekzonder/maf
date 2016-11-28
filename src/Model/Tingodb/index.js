'use strict';

var path = require('path');

var _ = require('lodash');

var ModelError = require(path.join(__dirname, '..', 'Error'));
var ModelErrorCodes = require(path.join(__dirname, '..', 'ErrorCodes'));

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

        this.Error = ModelError;
        this.errorCodes = ModelErrorCodes;

        this._db = db;
        this._collectionName = null;
        this._indexes = null;

        /*
            this._indexes = [
                {
                   fields: {
                       name: 1,
                       test: 1
                   },
                   options: {
                       background: true,
                       unique: true,
                       name: 'name'
                   }
                },
            ];
         */

        this._collection = null;

        this._debugger = null;
    }

    /**
     * set debugger object
     *
     * @param {Request/Debug} __debugger
     */
    setDebugger (__debugger) {
        this._debugger = __debugger;
    }

    /**
     * init collection of model
     *
     * @return {Promise}
     */
    init () {

        if (!this._collectionName) {

            throw new ModelError(
                'no collection name for model',
                ModelErrorCodes.NO_COLLECTION_NAME
            );

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
                    reject(error);
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

            timer.message = `tingodb.${this._collectionName}.insert(${this._json(data)})`;

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
    findOneAndUpdate (filter, update, sort, options) {

        var timer = this._createTimer('findOneAndUpdate');

        var queryOptions = {
            new: true
        };

        if (options) {
            if (options.returnOriginal) {
                queryOptions.new = Boolean(options.returnOriginal);
            }
        }

        if (!sort) {
            sort = ['_id', 1];
        }

        timer.message = `tingodb.${this._collectionName} filter=${this._json(filter)} update=${this._json(update)} options=${this._json(options)}`;

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
    findOne (query, options) {
        return new Promise((resolve, reject) => {

            if (!options) {
                options = {};
            }

            var timer = this._createTimer('findOne');
            timer.message = `tingodb.${this._collectionName} query=${this._json(query)} options=${this._json(options)}`;

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
     * @param {Object} options
     * @return {Promise}
     */
    findOneById (id, options) {
        return new Promise((resolve, reject) => {

            var timer = this._createTimer('findOneById');
            timer.message = `tingodb.${this._collectionName} id=${this._json(id)} options=${this._json(options)}`;

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
     * @param  {Object} filter
     * @param  {Object} fields
     * @return {Promise}
     */
    find (filter, fields) {

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
     * @param  {Object} options
     * @return {Promise}
     */
    update (filter, data, options) {

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
    remove (filter, options) {

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
     * not implemented in Tingodb
     *
     * @return {Promise}
     */
    aggregate () {

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
    _json (data) {
        return JSON.stringify(data);
    }


}

module.exports = ModelTingodb;
