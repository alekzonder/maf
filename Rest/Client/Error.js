'use strict';

var ErrorCheckChain = require('../../Error/CheckChain');

class RestApiClientError extends Error {

    constructor(message, code, entity) {
        super(message);

        this.code = null;
        this.entity = null;

        if (code) {
            this.code = code;
        }

        if (entity) {
            this.entity = entity;
        }

        this.checkable = true;
    }

    getCheckChain(logger) {
        return new ErrorCheckChain(this, null, logger);
    }

}

module.exports = RestApiClientError;
