'use strict';

var BaseError = require('../BaseError');

var RestError = BaseError.create('RestError', {
    FORBIDDEN: 'forbidden',
    NO_RESOURCES: 'no resources',
    NO_METHODS: 'no methods',
    NO_CALLBACK_IN_METHOD: 'no callback in method %method% %resource%',
    NO_METHOD_IN_RESOURCES: 'no method "%lcMethod%" in app for resource %method% %resource%',
    UNKNOWN_REST_MIDDLEWARE_POSITION: 'unknown maf/Rest middleware position: %position%',
    INVALID_DATA: 'invalid data'
});

module.exports = RestError;
