'use strict';

/**
 * @class
 */
class ErrorCheckChain {

    /**
     * @constructor
     * @param  {Error} error
     * @param  {string} entity
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
     * @param  {string} entity
     * @return {CheckChain}
     */
    ifEntity (entity) {
        if (typeof entity !== 'string') {
            throw new Error('ErrorCheckChain: entity argument must be a string');
        }

        var entityChain = new CheckChain(this._error, entity, this._logger);

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
            throw new Error('MazaiErrorCheckChain: fn argument must be a function');
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
     * @return {Boolean}
     */
    check () {

        if (this._entity && this._error.entity !== this._entity) {
            return false;
        }

        var result = null,
            r = false;

        for (var i in this._checks) {

            this._debug(`check chain for entity = ${this._entity}, step = ${i}`);

            var check = this._checks[i];

            if (check instanceof CheckChain) {
                r = check.check();

                if (r) {
                    result = true;
                    break;
                }

            } else if (typeof check === 'function') {

                this._debug(`check function entity = ${this._entity}, step = ${i}`);

                r = check();

                if (r) {
                    result = true;
                    r(this._error);
                    break;
                }
            } else {
                throw new Error('ErrorCheckChain: check is not a function');
            }

        }

        if (result) {
            return true;
        } else if (!this._entity && this._default) {
            this._debug('ErrorCheckChain: using default callback function');
            this._default(this._error);
            return true;
        } else if (!this._entity && !this._default) {
            throw new Error('ErrorCheckChain: no default callback function');
        } else {
            return false;
        }

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
