var joi = require('joi');
var _ = require('lodash');

module.exports = {
    schema: joi.alternatives().try(joi.array().items(joi.string()), joi.string()).default(null),

    get: function (obj, name) {

        var rawFields = _.get(obj, name, null);

        if (!rawFields) {
            return null;
        }

        var fields = null;

        if (typeof rawFields === 'string') {
            fields = _.map(rawFields.split(','), v => _.trim(v));
        } else if (Array.isArray(rawFields)) {
            fields = rawFields;
        } else {
            // TODO
        }

        return fields;
    }
};
