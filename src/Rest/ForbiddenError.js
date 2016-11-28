'use strict';

var ErrorCheckChain = require('../Error/CheckChain');

class ForbiddenError extends Error {

    constructor (message, code, entity, list) {
        super(message);

        this.message = 'forbidden';
        this.code = 'forbidden';
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

        this.forbidden = true;
        this.checkable = true;
    }

    getCheckChain (defaultResponse, logger) {
        if (!defaultResponse) {
            throw new Error('ForbiddenErrorCheckChain: no default response');
        }

        var chain = new ErrorCheckChain(this, null, logger);

        chain.setDefault(defaultResponse);

        return chain;
    }

}

module.exports = ForbiddenError;
