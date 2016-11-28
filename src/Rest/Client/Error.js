'use strict';

var ErrorCheckChain = require('../../Error/CheckChain');

class RestApiClientError extends Error {

    constructor (message, code, entity, list) {
        super(message);

        this.code = null;
        this.entity = null;
        this.list = null;

        if (code) {
            this.code = code;
        }

        if (entity) {
            this.entity = entity;
        }

        if (list) {
            this.list = list;
        }

        this.checkable = true;
    }

    getCheckChain (defaultResponse, logger) {
        if (!defaultResponse) {
            throw new Error('RestAiErrorCheckChain: no default response');
        }

        var chain = new ErrorCheckChain(this, null, logger);

        chain.setDefault(defaultResponse);

        return chain;
    }

}

module.exports = RestApiClientError;
