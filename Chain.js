'use strict';


class Chain {

    constructor(config) {

        this._config = config;

        this._execCallback = null;

        this._data = {};

        this._init();

    }

    _init() {
        var that = this;

        var makeSimpleStep = function(stepName) {
            return function(value) {
                if (value) {
                    this._data[stepName] = value;
                }

                return this;
            };
        };

        var makeFunctionStep = function (stepName, step) {

            return function(value) {
                value = step.call(this, value);

                if (typeof value !== 'undefined') {
                    this._data[stepName] = value;
                }

                return this;
            };

        };

        for (var name in this._config.steps) {

            var step = this._config.steps[name];

            if (step === null) {
                that[name] = makeSimpleStep(name);
            } else if (typeof step == 'function') {
                that[name] = makeFunctionStep(name, step);
            } else {
                throw new Error('unknown step value in maf/Chain for step: ' + name);
            }

        }
    }

    mapToChain(data) {

        for (var name in data) {
            if (!this[name]) {
                throw new Error(`no method "${name}" in maf/Chain`);
            }

            this[name](data[name]);
        }

        return this;
    }

    onExec(callback) {
        this._execCallback = callback;
    }

    get data() {
        return this._data;
    }

    exec() {
        if (!this._execCallback) {
            throw new Error('no callback for ' + this.constructor.name);
        }

        return this._execCallback(this._data);
    }

}

module.exports = Chain;
