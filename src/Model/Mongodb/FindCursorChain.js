'use strict';

var path = require('path');

var ModelError = require(path.join(__dirname, '..', 'Error'));

class FindCursorChain {

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

        // this._debugMessage = `.find(${this._json(filter)}, ${this._json(fields)})`;
    }

    onExec (callback) {
        this._execCallback = callback;
    }

    fields (fields) {
        if (fields) {
            this._cursor.project(fields);
        }

        if (this._debugTimer) {
            this._debugTimer.fields = fields;
        }

        return this;
    }

    sort (sort) {
        if (sort) {
            if (this._debugTimer) {
                this._debugTimer.sort = sort;
            }

            // this._debugMessage += `.sort(${this._json(sort)})`;

            this._cursor.sort(sort);
        }

        return this;
    }

    limit (limit) {
        if (this._debugTimer) {
            this._debugTimer.limit = limit;
        }

        this._cursor.limit(limit);

        return this;
    }

    skip (skip) {
        if (skip) {

            if (this._debugTimer) {
                this._debugTimer.skip = skip;
            }

            this._cursor.skip(skip);
        }

        return this;
    }

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

    exec () {
        if (!this._execCallback) {
            throw new ModelError(ModelError.CODES.FIND_CURSOR_CHAIN_NO_CALLBACK);
        }

        return this._execCallback(this._cursor);
    }

    _json (data) {
        return JSON.stringify(data);
    }

}

module.exports = FindCursorChain;
