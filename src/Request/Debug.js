'use strict';

class RequestDebug {

    constructor () {
        this._log = [];
    }

    log (data) {
        this._log.push(data);
    }

    get () {
        return this._log;
    }
}

module.exports = RequestDebug;
