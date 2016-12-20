'use strict';

var BaseError = require('../BaseError');

var ApiError = BaseError.create('ApiError', {
    INVALID_DATA: 'invalid data',
    ALREADY_EXISTS: 'already exists',
    NOT_FOUND: 'not found'
});

module.exports = ApiError;
