'use strict';

var superagent = require('superagent');
var qs = require('qs');
var DebugTimer = require('../../Debug/Timer');

var RestApiClientError = require('./Error');

class RestApiClient {

    constructor() {
        this._debugger = null;
    }

    setDebugger(debug) {
        this._debugger = debug;
    }

    get(url, query, options) {

        return new Promise((resolve, reject) => {

            var timer = this._createTimer('get');

            timer.message = {
                url: url + '?' + qs.stringify(query),
                options: options
            };

            if (!options || typeof options !== 'object') {
                options = {};
            }

            var request = superagent.get(url);

            if (query) {
                request.query(query);
            }

            if (options.timeout) {
                request.timeout(options.timeout);
            }

            request.end((err, res) => {
                if (err) {
                    var e = this._processError(err);

                    timer.error(e);
                    reject(e);

                    return;
                }

                timer.stop();

                resolve(res.body);
            });

        });

    }

    post(url, body, options) {

        return new Promise((resolve, reject) => {

            var timer = this._createTimer('post');

            timer.message = {
                url: url,
                body: body,
                options: options
            };

            if (!options || typeof options !== 'object') {
                options = {};
            }

            var request = superagent.post(url);

            if (options.timeout) {
                request.timeout(options.timeout);
            }

            if (body) {
                request.send(body);
            }

            request.end((err, res) => {
                if (err) {
                    var e = this._processError(err);

                    timer.error(e);
                    reject(e);

                    return;
                }

                timer.stop();

                resolve(res.body);
            });
        });

    }

    /**
     * emit debug data
     *
     * @param  {Object} data
     */
    _logDebug(data) {

        if (!this._debugger || !this._debugger.log) {
            return;
        }

        this._debugger.log(data);
    }

    /**
     * create debug timer
     *
     * @param  {String} name
     * @return {DebugTimer}
     */
    _createTimer(name) {
        var timer = new DebugTimer('http', name);

        timer.onStop((data) => {
            this._logDebug(data);
        });

        return timer;
    }

    /**
     * json helper
     *
     * @param  {Object} data
     * @return {String}
     */
    _json(data) {
        return JSON.stringify(data);
    }

    /**
     * process api error
     *
     * @param  {Error} error
     * @return {Error}
     */
    _processError(error) {

        if (error.response &&
            error.response.body &&
            error.response.body.error &&
            error.response.body.error.code &&
            error.response.body.error.message
        ) {

            var e = new RestApiClientError(
                error.response.body.error.message,
                error.response.body.error.code,
                error.response.body.error.entity,
                error.response.body.error.list
            );

            // e.prevError = error;

            return e;

        } else {
            return error;
        }
    }
}

module.exports = RestApiClient;
