'use strict';

var BaseError = require('../BaseError');

var ErrorCodes = {
    INVALID_DATA: 'invalid data',
    ALREADY_EXISTS: 'document already exists',
    NOT_FOUND: 'not found',
    NO_SYSTEM_FIELDS: 'no system fields'
};

var ApiError = BaseError.create('ApiError', ErrorCodes);

ApiError.createWithEntityName = function (entity) {

    var errorClass = BaseError.create(entity + 'ApiError', ErrorCodes);

    errorClass.prototype.entity = entity;

    return errorClass;
};

module.exports = ApiError;
