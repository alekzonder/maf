var terror = require('terror');

var ErrorCheckChain = require('./Error/CheckChain');

terror.prototype.stackTraceLimit = 50;

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
