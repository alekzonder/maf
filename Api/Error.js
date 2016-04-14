'use strict';

var ErrorCheckChain = require('./ErrorCheckChain');

/**
 * @class
 */
class ApiError extends Error {

    /**
     * @constructor
     * @param  {String} message
     * @param  {String} code
     * @param  {Number} status
     */
    constructor(message, code, status, list) {
        super(message);

        this.name = 'ApiError';

        this.code = code;
        this.status = status;

        if (list) {
            this.list = list;
        } else {
            this.list = [];
        }

        this.entity = null;

        this.checkable = true;
    }

    getCheckChain(defaultResponse, logger) {
        if (!defaultResponse) {
            throw new Error('RestAiErrorCheckChain: no default response');
        }

        var chain = new ErrorCheckChain(this, null, logger);

        chain.setDefault(defaultResponse);

        return chain;
    }

}

module.exports = ApiError;
