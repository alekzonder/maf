'use strict';

/**
 * Data chain object
 *
 * @example
 * var Chain = require('maf/Chain');
 * var chain = new Chain({limit: {defaults: 5}, skip: null});
 * chain.onExec((data) => {console.log(data);});
 *
 * chain.skip(5).limit(10).exec(); // get data in onExec callback
 * // OR
 * var data = chain.skip(5).limit(10).data();
 *
 *
 */
class Chain {

    /**
     * @param {Object} config
     */
    constructor (config) {

        this._config = config;

        this._execCallback = null;

        this._data = {};

        this._init();

    }

    /**
     * return collected data
     *
     * @return {Object}
     */
    get data () {
        return this._data;
    }

    /**
     * init chain by config
     *
     * @private
     */
    _init () {
        var that = this;

        var makeSimpleStep = function (stepName) {
            return function (value) {
                if (value) {
                    this._data[stepName] = value;
                }

                return this;
            };
        };

        var makeFunctionStep = function (stepName, step) {

            return function () {
                var args = [this._data];

                for (var i in arguments) {
                    args.push(arguments[i]);
                }

                var value = step.apply(this, args);

                if (typeof value !== 'undefined') {
                    this._data[stepName] = value;
                }

                return this;
            };

        };

        if (typeof this._config.defaults === 'object') {
            this._data = JSON.parse(JSON.stringify(this._config.defaults));
        }

        for (var name in this._config.steps) {

            var step = this._config.steps[name];

            if (typeof step === 'function') {
                that[name] = makeFunctionStep(name, step);
            } else {
                that[name] = makeSimpleStep(name);
            }

        }
    }

    /**
     * map data to chain
     *
     * @param {Object} data
     * @return {this}
     */
    mapToChain (data) {

        for (var name in data) {
            if (!this[name]) {
                throw new Error(`no method "${name}" in maf/Chain`);
            }

            this[name](data[name]);
        }

        return this;
    }

    /**
     * set exec callback
     *
     * @param {Function} callback
     */
    onExec (callback) {
        this._execCallback = callback;
    }

    /**
     * exec onExec callback
     *
     * @return {*}
     */
    exec () {
        if (!this._execCallback) {
            return this._data;
        }

        return this._execCallback(this._data);
    }

    /**
     * alias for exec
     *
     * @return {*}
     */
    done () {
        return this.exec();
    }

}

module.exports = Chain;
