'use strict';


class DebugTimer {

    constructor(type, name) {
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

    get type() {
        return this._data.type;
    }

    set type(type) {
        this._data.type = type;
    }

    get name() {
        return this._data.name;
    }

    set name(name) {
        this._data.name = name;
    }

    get message()  {
        return this._data.name;
    }

    set message(message) {
        this._data.message = message;
    }

    stop() {
        this._data.time = {
            sec: (new Date().getTime()) - this._start
        };

        var data = this.toJSON();

        if (this._stopCallback) {
            this._stopCallback(data);
        }

        return data;
    }

    toJSON() {
        return this._data;
    }

    onStop(callback) {
        this._stopCallback = callback;
    }

}


module.exports = DebugTimer;
