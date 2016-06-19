'use strict';

class ErrorCheckChain {

    constructor(error, entity, logger) {

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

    setDefault(fn) {
        this._default = fn;
    }

    setParent(parent) {
        this._parent = parent;
    }

    ifEntity(entity) {
        if (typeof entity != 'string') {
            throw new Error('ErrorCheckChain: entity argument must be a string');
        }

        var entityChain = new ErrorCheckChain(this._error, entity, this._logger);

        entityChain.setParent(this);

        this._checks.push(entityChain);

        return entityChain;
    }

    ifCode(code, fn) {

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

    end() {
        if (this._parent) {
            return this._parent;
        }

        return this;
    }

    check() {

        if (this._entity && this._error.entity !== this._entity) {
            return false;
        }

        var result = null,
            r = false;

        for (var i in this._checks) {

            this._debug(`check chain for entity = ${this._entity}, step = ${i}`);

            var check = this._checks[i];

            if (check instanceof ErrorCheckChain) {
                r = check.check();

                if (r) {
                    result = true;
                    break;
                }

            } else if (typeof check == 'function') {

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
            this._debug('ErrorCheckChain: using default function');
            this._default(this._error);
            return true;
        } else if (!this._entity && !this._default) {
            throw new Error('ErrorCheckChain: no default function');
        } else {
            return false;
        }

    }

    _debug() {

        if (this._logger && this._logger.debug && typeof this._logger.debug === 'function') {
            this._logger.debug.apply(this._logger, arguments);
        }

    }

}

module.exports = ErrorCheckChain;
