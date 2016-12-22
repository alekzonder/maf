var _ = require('lodash');

module.exports = {

    get: function (obj, names) {
        return _.pick(obj, names);
    }

};
