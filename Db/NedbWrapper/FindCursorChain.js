"use strict";

class FindCursorChain {

    constructor(query, nedb) {
        this._query = query;
        this._nedb = nedb;

        this._fields = null;
        this._sort = null;
        this._limit = null;
        this._skip = null;
    }

    project(fields) {
        this._fields = fields;
        return this;
    }

    sort(sort) {
        this._sort = sort;
        return this;
    }

    limit(limit) {
        this._limit = limit;
        return this;
    }

    skip(skip) {
        this._skip = skip;
        return this;
    }

    count() {

        return new Promise((resolve, reject) => {
            this._nedb.count(this._query, (err, count) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(count);
            });
        });

    }

    toArray() {

        return new Promise((resolve, reject) => {
            var cursor = this._nedb.find(this._query, this._fields);

            if (this._sort) {
                cursor.sort(this._sort);
            }

            if (this._limit) {
                cursor.limit(this._limit);
            }

            if (this._skip) {
                cursor.skip(this._skip);
            }

            cursor.exec((err, docs) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(docs);
            });


        });

    }


}

module.exports = FindCursorChain;
