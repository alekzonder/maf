'use strict';

var FindCursorChain = require('./FindCursorChain');

class Nedb {

    /**
     * constructor
     * @param  {Object} nedb Nedb database object
     */
    constructor (nedb) {
        this._nedb = nedb;
    }

    /**
     * collection method
     *
     * @return {this}
     */
    collection (/* name */) {
        return this;
    }

    /**
     * check if index exists
     *
     * @return {Boolean}
     */
    indexExists (/* name */) {
        // no fails for index duplication in nedb
        return false;
    }

    /**
     * create nedb index
     * @param  {Object} fields
     * @param  {Object} options
     * @return {Promise}
     */
    createIndex (fields, options) {

        return new Promise((resolve, reject) => {

            if (fields.length > 1) {
                reject('nedb do\'t support multifield indexes');
                return;
            }

            var data = {};

            data.fieldName = fields[0];

            if (options.unique) {
                data.unique = options.unique;
            }

            if (options.sparse) {
                data.sparse = options.sparse;
            }

            if (options.expireAfterSeconds) {
                data.expireAfterSeconds = options.expireAfterSeconds;
            }

            this._nedb.ensureIndex(data, (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve();
            });
        });
    }

    /**
     * insert one record
     *
     * @param  {Object} data
     * @return {Promise}
     */
    insertOne (data /*, options */) {

        return new Promise((resolve, reject) => {

            this._nedb.insert(data, (err, doc) => {

                if (err) {

                    if (err.errorType && err.errorType == 'uniqueViolated') {
                        err.code = 11000;
                    }

                    reject(err);
                    return;
                }

                resolve({
                    ops: [
                        doc
                    ]
                });
            });
        });
    }

    /**
     * findOneAndUpdate
     *
     * @param  {Object} filter
     * @param  {Object} update
     * @param  {Object} options
     * @return {Promise}
     */
    findOneAndUpdate (filter, update, options) {

        return new Promise((resolve, reject) => {
            var nedbOptions = {
                multi: false
            };

            if (options.upsert) {
                nedbOptions.upsert = options.upsert;
            }

            // if (options.returnOriginal) {
            // nedbOptions.returnUpdatedDocs = true;
            // }

            this._nedb.update(filter, update, options, (err, numReplaced) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve({modifiedCount: numReplaced});
            });
        });

    }

    /**
     * findOne
     *
     * @param  {Object} query
     * @param  {Object} options
     * @return {Promise}
     */
    findOne (query, options) {

        return new Promise((resolve, reject) => {

            if (typeof options == 'undefined') {
                options = {};
            }

            var fields = (options.fields) ? options.fields : {};

            var cursor = this._nedb.find(query, fields);

            if (options.sort) {
                cursor.sort = options.sort;
            }

            cursor.limit(1);

            cursor.exec((err, docs) => {

                if (err) {
                    reject(err);
                    return;
                }

                if (docs && docs.length) {
                    resolve(docs[0]);
                } else {
                    resolve(null);
                }

            });
        });

    }

    /**
     * find
     *
     * @param  {Object} query
     * @return {Promise}
     */
    find (query) {
        return new FindCursorChain(query, this._nedb);
    }

    /**
     * update
     *
     * @param  {Object} selector
     * @param  {Object} document
     * @param  {Object} options
     * @return {Promise}
     */
    update (selector, document, options) {

        return new Promise((resolve, reject) => {
            var nedbOptions = {
                multi: (options.multi) ? options.multi : null,
                upsert: (options.upsert) ? options.upsert : null,
            };

            this._nedb.update(selector, document, nedbOptions, (err, numReplaced, newDoc) => {

                if (err) {
                    reject(err);
                    return;
                }

                resolve(newDoc);

            });
        });

    }

    /**
     * remove
     *
     * @param  {Object} selector
     * @param  {Object} options
     * @return {Promise}
     */
    remove (selector, options) {

        return new Promise((resolve, reject) => {

            this._nedb.remove(selector, {multi: (options.multi) ? options.multi : null}, (err, numRemoved) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(numRemoved);
            });

        });

    }

    /**
     * count
     *
     * @param  {Object} query
     * @return {Promise}
     */
    count (query /*, options */) {

        return new Promise((resolve, reject) => {

            this._nedb.count(query, (err, count) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(count);
            });

        });

    }

    /**
     * aggregate
     *
     * @return {Promise}
     */
    aggregate () {
        return new Promise((resolve, reject) => {
            reject(new Error('nedb do\'t support aggregate'));
        });
    }

}


module.exports = Nedb;
