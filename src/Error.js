var path = require('path');

var terror = require('terror');

var ErrorCheckChain = require(path.resolve(`${__dirname}/Error/CheckChain`));

terror.prototype.checkable = true;

terror.prototype.getCheckChain = function (defaultResponseFn, logger) {

    if (!defaultResponseFn) {
        throw new Error('ErrorCheckChain: no default response function passed in getCheckChain');
    }

    var chain = new ErrorCheckChain(this, null, logger);

    chain.setDefault(defaultResponseFn);

    return chain;
};

module.exports = terror;
