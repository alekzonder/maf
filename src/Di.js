'use strict';

/**
 * Dependency Injection class
 */
class Di {

    /**
     *
     */
    constructor () {
        this._config = null;
        this._logger = null;

        this._models = null;
        this._api = null;

        this._debug = null;

        this._connections = {};
    }

    /**
     * @return {Object}
     */
    get config () {
        return this._config;
    }

    /**
     * @param  {Object} config
     */
    set config (config) {
        this._config = config;
    }

    /**
     * @return {logger}
     */
    get logger () {
        return this._logger;
    }

    /**
     * @param  {logger} logger
     */
    set logger (logger) {
        this._logger = logger;
    }

    /**
     * @return {Object}
     */
    get models () {
        return this._models;
    }

    /**
     * @param  {Object} models
     */
    set models (models) {
        this._models = models;
    }

    /**
     * @return {Object}
     */
    get api () {
        return this._api;
    }

    /**
     * @param  {Object} api
     */
    set api (api) {
        this._api = api;
    }

    /**
     * @return {Object}
     */
    get debug () {
        return this._debug;
    }

    /**
     * @param  {Object} debug
     */
    set debug (debug) {
        this._debug = debug;
    }

    /**
     * set connection object
     *
     * @param {String} name
     * @param {Object} connection
     */
    setConnection (name, connection) {
        this._connections[name] = connection;
    }

    /**
     * get connection object by name
     *
     * @param {String} name
     * @return {Object|Null}
     */
    getConnection (name) {
        return this._connections[name];
    }

    /**
     * get all connections
     *
     * @return {Object}
     */
    getConnections () {
        return this._connections;
    }

    /**
     * set connections
     *
     * @param {Object} connections
     */
    setConnections (connections) {
        this._connections = connections;
    }

}

module.exports = Di;
