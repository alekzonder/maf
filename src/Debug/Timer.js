'use strict';

class DebugTimer {

    constructor (type, name) {
        this._start = new Date().getTime();

        this._data = {
            time: null,
            type: null,
            name: null,
            message: null
        };

        if (type) {
            this._data.type = type;
        }

        if (name) {
            this._data.name = name;
        }

        this._stopCallback = null;
    }

    get type () {
        return this._data.type;
    }

    set type (type) {
        this._data.type = type;
    }

    get name () {
        return this._data.name;
    }

    set name (name) {
        this._data.name = name;
    }

    get message () {
        return this._data.name;
    }

    set message (message) {
        if (typeof message == 'object') {
            message = JSON.stringify(message);
        }

        this._data.message = message;
    }

    stop () {
        var msec = (new Date().getTime()) - this._start;

        this._data.time = {
            sec: msec / 1000,
            msec: msec
        };

        var data = this.toJSON();

        if (this._stopCallback) {
            this._stopCallback(data);
        }

        return data;
    }

    error (error) {
        if (error.message) {

            this._data.error = {
                message: error.message
            };

            if (error.code) {
                this._data.error.code = error.code;
            }

            if (error.entity) {
                this._data.error.entity = error.entity;
            }

        } else {
            this._data.error = error;
        }

        this.stop();
    }

    toJSON () {
        return this._data;
    }

    onStop (callback) {
        this._stopCallback = callback;
    }
}

module.exports = DebugTimer;
