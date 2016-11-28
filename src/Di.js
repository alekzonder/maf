'use strict';

class Di {

    constructor () {
        this._config = null;
        this._logger = null;

        this._models = null;
        this._api = null;

        this._debug = null;

        this._connections = {};
    }

    get config () {
        return this._config;
    }

    set config (v) {
        this._config = v;
    }

    get logger () {
        return this._logger;
    }

    set logger (logger) {
        this._logger = logger;
    }

    get models () {
        return this._models;
    }

    set models (models) {
        this._models = models;
    }

    get api () {
        return this._api;
    }

    set api (api) {
        this._api = api;
    }

    get debug () {
        return this._debug;
    }

    set debug (debug) {
        this._debug = debug;
    }

    setConnection (name, connection) {
        this._connections[name] = connection;
    }

    getConnection (name) {
        return this._connections[name];
    }

}

module.exports = Di;
