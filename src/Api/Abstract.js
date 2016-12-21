'use strict';

var _ = require('lodash');
var uuid = require('uuid');

var BaseAbstract = require('./BaseAbstract');

class Abstract extends BaseAbstract {

    /**
     * @constructor
     * @param  {Object} models
     * @param  {Object} api
     */
    constructor (models, api) {
        super(models, api);

        this._creationSchema = null;
        this._modificationSchema = null;
    }

    /**
     * get creation schema
     *
     * @return {Object}
     */
    getCreationSchema () {
        return _.cloneDeep(this._creationSchema);
    }

    /**
     * get modification schema
     *
     * @return {Object}
     */
    getModificationSchema () {
        return _.cloneDeep(this._modificationSchema);
    }

    /**
     * validate creation data by schema
     *
     * @param {Object} data
     * @param {Object} options
     * @return {Promise}
     */
    _validateCreation (data, options) {
        return this._validate(data, this._creationSchema, options);
    }

    /**
     * validate modification data by schema
     *
     * @param {Object} data
     * @param {Object} options
     * @return {Promise}
     */
    _validateModification (data, options) {
        return this._validate(data, this._modificationSchema, options);
    }

    /**
     * get uuid
     *
     * @return {String}
     */
    _generateUuid () {
        return uuid.v4();
    }

    /**
     * get current timestamp
     *
     * @return {Number}
     */
    _time () {
        var date = new Date();
        return Math.round(date.getTime() / 1000);
    }

    /**
     * get current timestamp with microseconds
     *
     * @return {Number}
     */
    _microtime () {
        return (new Date()).getTime();
    }

    /**
      * prepare fields
      *
      * @param  {Object} fields
      * @return {Object}
      */
    _prepareFields (fields) {
        var result = {};

        _.each(fields, (f) => {
            result[f] = 1;
        });

        return result;
    }
}

module.exports = Abstract;
