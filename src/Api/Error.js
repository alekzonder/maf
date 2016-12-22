'use strict';

var BaseError = require('../BaseError');

var ErrorCodes = {
    NO_SYSTEM_FIELDS: 'no system fields',
    ALREADY_EXISTS: 'document already exists',
    NOT_FOUND: 'not found',
    INVALID_DATA: 'invalid data',
    FORBIDDEN: 'forbidden'
};

var ApiError = BaseError.create('ApiError', ErrorCodes);

ApiError.createWithEntityName = function (entity) {

    var errorClass = BaseError.create(entity + 'ApiError', ErrorCodes);

    errorClass.prototype.entity = entity;

    return errorClass;
};

module.exports = ApiError;
