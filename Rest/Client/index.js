'use strict';

var request = require('superagent');
var DebugTimer = require('../../Debug/Timer');

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
                url: url,
                body: query,
                options: options
            };

            var r = request.get(url);

            if (query) {
                r.query(query);
            }

            r.end((err, res) => {
                if (err) {
                    timer.error(err.message);
                    reject(err);
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

            var r = request.post(url);

            if (body) {
                request.send(body);
            }

            request.end((err, res) => {
                if (err) {
                    timer.error(err.message);
                    reject(err);
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
}

module.exports = RestApiClient;
