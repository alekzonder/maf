'use strict';

var BaseError = require('../BaseError');

var ErrorCodes = {
    INVALID_CREATE_FUNCTIONS_PARAM: 'invalid createFunctions param. Should be function or object with functions',
    UNKNOWN_API: 'unknown api: %name%'
};

var ApiCollectionError = BaseError.create('ApiCollectionError', ErrorCodes);

module.exports = ApiCollectionError;
