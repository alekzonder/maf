'use strict';

class Di {

    constructor() {
        this.models = null;
        this.api = null;
        this.config = null;
        this.logger = null;
        this.db = null;
    }

    setDb(db) {
        this.db = db;
    }

    getDb() {
        return this.db;
    }

    getModels() {
        return this.models;
    }

    setModels(models) {
        this.models = models;
    }

    getApi() {
        return this.api;
    }

    setApi(api) {
        this.api = api;
    }

    getConfig() {
        return this.config;
    }

    setConfig(config) {
        this.config = config;
    }

    getLogger() {
        return this.logger;
    }

    setLogger(logger) {
        this.logger = logger;
    }

}

module.exports = Di;
