'use strict';

class Di {

    constructor() {
        this._models = null;
        this._api = null;
        this._config = null;
        this._logger = null;
        this._db = null;
    }

    setDb(db) {
        this._db = db;
    }

    getDb() {
        return this._db;
    }

    getModels() {
        return this._models;
    }

    setModels(models) {
        this._models = models;
    }

    getApi() {
        return this._api;
    }

    setApi(api) {
        this._api = api;
    }

    getConfig() {
        return this._config;
    }

    setConfig(config) {
        this._config = config;
    }

    getLogger() {
        return this._logger;
    }

    setLogger(logger) {
        this._logger = logger;
    }

}

module.exports = Di;
