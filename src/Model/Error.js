'use strict';

/**
 * Model Error
 *
 * @class
 */
class ModelError extends Error {

    /**
     *
     * @param  {String} message
     * @param  {String} code
     */
    constructor (message, code) {
        super(message);
        this.code = code;
    }

}

module.exports = ModelError;
