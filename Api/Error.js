'use strict';

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

    }

}

module.exports = ApiError;
