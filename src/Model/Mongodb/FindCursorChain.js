'use strict';

var path = require('path');

var ModelError = require(path.join(__dirname, '..', 'Error'));

class FindCursorChain {

    constructor (collection, filter, fields) {
        this._collection = collection;
        this._cursor = collection.find(filter);

        this._execCallback = null;

        if (fields) {
            this._cursor.project(fields);
        }

        this._debugMessage = `.find(${this._json(filter)}, ${this._json(fields)})`;
    }

    onExec (callback) {
        this._execCallback = callback;
    }

    fields (fields) {
        if (fields) {
            this._cursor.project(fields);
        }

        return this;
    }

    sort (sort) {
        if (sort) {
            this._debugMessage += `.sort(${this._json(sort)})`;
            this._cursor.sort(sort);
        }

        return this;
    }

    limit (limit) {
        this._debugMessage += `.limit(${limit})`;
        this._cursor.limit(limit);
        return this;
    }

    skip (skip) {
        if (skip) {
            this._debugMessage += `.skip(${skip})`;
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
        }

        return this;
    }

    exec () {
        if (!this._execCallback) {
            throw new ModelError(ModelError.CODES.FIND_CURSOR_CHAIN_NO_CALLBACK);
        }

        var debugMessage = `${this._collection.namespace}: db.${this._collection.collectionName}${this._debugMessage}`;

        return this._execCallback(this._cursor, debugMessage);
    }

    _json (data) {
        return JSON.stringify(data);
    }

}

module.exports = FindCursorChain;
