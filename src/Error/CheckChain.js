'use strict';

/**
 * @class
 */
class ErrorCheckChain {

    /**
     * @constructor
     * @param  {Error} error
     * @param  {String} entity
     * @param  {logger} logger
     */
    constructor (error, entity, logger) {

        this._logger = logger;

        this._error = error;

        this._entity = null;

        if (entity) {
            this._entity = entity;
        }

        this._default = null;

        this._parent = null;

        this._checks = [];
    }

    /**
     * set default check callback
     *
     * @param {Function} fn
     * @return {this}
     */
    setDefault (fn) {
        this._default = fn;
        return this;
    }

    /**
     * set parent checkChain
     *
     * @param {CheckChain} parent
     */
    setParent (parent) {
        this._parent = parent;
    }

    /**
     * create new checkChain for entity
     *
     * @param  {String} entity
     * @return {ErrorCheckChain}
     */
    ifEntity (entity) {
        if (typeof entity !== 'string') {
            throw new Error('ErrorCheckChain: entity argument must be a string');
        }

        var entityChain = new ErrorCheckChain(this._error, entity, this._logger);

        entityChain.setParent(this);

        this._checks.push(entityChain);

        return entityChain;
    }

    /**
     * set callback if code
     *
     * @param  {String}   code
     * @param  {Function} fn
     * @return {CheckChain}
     */
    ifCode (code, fn) {

        if (typeof fn !== 'function') {
            throw new Error('ErrorCheckChain: fn argument must be a function');
        }

        var f = () => {
            if (this._error.code !== code) {
                return false;
            }

            return fn;
        };

        f.ifCode = true;

        this._checks.push(f);

        return this;
    }

    /**
     * end parent check chain
     *
     * @return {String}
     */
    end () {
        if (this._parent) {
            return this._parent;
        }

        return this;
    }

    /**
     * run checks
     *
     * @param {logger} logger
     * @return {Boolean}
     */
    check (logger) {

        if (this._entity && this._error.entity !== this._entity) {
            return false;
        }

        if (logger) {
            this._logger = logger;
        }

        for (var i in this._checks) {

            var check = this._checks[i];

            this._debug(`check chain for entity = ${this._entity}, step = ${i}`);

            if (this._isValidCheck(i, check) === false) {
                throw new Error('ErrorCheckChain: check is not a function');
            }

            if (this._ifInstanceOfCheckChain(i, check)) {
                var result = check.check(this._logger);

                if (result) {
                    return true;
                }

            } else if (this._ifFunction(i, check)) {
                return true;
            }

        }

        if (!this._entity) {

            if (this._default) {
                this._debug('ErrorCheckChain: using default callback function');
                this._default(this._error);
                return true;
            } else {
                throw new Error('ErrorCheckChain: no default callback function');
            }

        }

        return false;

    }

    _isValidCheck (i, check) {
        return check instanceof ErrorCheckChain || typeof check === 'function';
    }

    _ifInstanceOfCheckChain (i, check) {
        return check instanceof ErrorCheckChain;
    }

    _ifFunction (i, check) {
        this._debug(`check function entity = ${this._entity}, step = ${i}`);

        var fnResult = check();

        this._debug(fnResult);

        if (fnResult) {
            fnResult(this._error);
            return true;
        }

        return false;
    }

    /**
     * log debug
     *
     * @private
     */
    _debug () {

        if (this._logger && this._logger.debug && typeof this._logger.debug === 'function') {
            this._logger.debug.apply(this._logger, arguments);
        }

    }

}

module.exports = ErrorCheckChain;
