'use strict';

var path = require('path');

var ModelError = require(path.join(__dirname, '..', 'Error'));

/**
 * find cursor chain class
 */
class MongodbFindCursorChain {

    /**
     * @param {Object} collection
     * @param {Object} filter
     * @param {Object} fields
     * @param {DebugTimer} debugTimer
     */
    constructor (collection, filter, fields, debugTimer) {
        this._collection = collection;

        this._cursor = collection.find(filter);

        this._execCallback = null;

        this._debugTimer = null;

        if (debugTimer) {
            this._debugTimer = debugTimer;

            this._debugTimer.data = {
                collection: this._collection.namespace,
                filter: filter,
                fields: fields,
                params: {}
            };
        }

        if (fields) {
            this._cursor.project(fields);
        }

    }

    /**
     * @param {Function} callback
     */
    onExec (callback) {
        this._execCallback = callback;
    }

    /**
     * @param {Object} fields
     * @return {this}
     */
    fields (fields) {
        if (fields) {
            this._cursor.project(fields);
        }

        if (this._debugTimer) {
            this._debugTimer.fields = fields;
        }

        return this;
    }

    /**
     * @param {Object} sort
     * @return {this}
     */
    sort (sort) {
        if (sort) {
            if (this._debugTimer) {
                this._debugTimer.sort = sort;
            }

            this._cursor.sort(sort);
        }

        return this;
    }

    /**
     * @param {Number} limit
     * @return {this}
     */
    limit (limit) {
        if (this._debugTimer) {
            this._debugTimer.limit = limit;
        }

        this._cursor.limit(limit);

        return this;
    }

    /**
     * @param {Number} skip
     * @return {this}
     */
    skip (skip) {
        if (skip) {

            if (this._debugTimer) {
                this._debugTimer.skip = skip;
            }

            this._cursor.skip(skip);
        }

        return this;
    }

    /**
     * @param {Object} data
     * @return {this}
     */
    mapToChain (data) {

        for (var name in data) {
            if (!this[name]) {
                var error = new ModelError(ModelError.CODES.FIND_CURSOR_CHAIN_NO_METHOD);
                error.bind({name: name});
                throw error;
            }

            this[name](data[name]);

            if (this._debugTimer) {
                this._debugTimer.data.params[name] = data[name];
            }
        }

        return this;
    }

    /**
     * exec cursor
     *
     * @return {Promise}
     */
    exec () {
        if (!this._execCallback) {
            throw new ModelError(ModelError.CODES.FIND_CURSOR_CHAIN_NO_CALLBACK);
        }

        return this._execCallback(this._cursor);
    }

}

module.exports = MongodbFindCursorChain;
