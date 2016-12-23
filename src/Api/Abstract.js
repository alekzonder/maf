var path = require('path');

var _ = require(path.resolve(__dirname, '../vendors/lodash'));
var uuid = require(path.resolve(__dirname, '../vendors/uuid'));

var Abstract = require('./BaseAbstract');

var BaseApiError = require('./Error');

var Chain = require(path.resolve(__dirname, '../Chain'));

var DebugTimer = require(path.join(__dirname, '..', 'Debug', 'Timer'));

var ApiError = BaseApiError.extendCodes({
    NO_MODEL_NAME: 'maf/Api/CrudAbstract: no model name in constructor',
    NO_MODEL: 'maf/Api/CrudAbstract: no model with name = %name%'
});


class ApiAbstract extends Abstract {

    /**
     * @constructor
     * @param {Object} models
     * @param {Object} api
     * @param {String} modelName
     */
    constructor (models, api, modelName) {
        super(models, api);

        this.entity = null;

        this.Error = ApiError;

        this._modelName = modelName;

        this._creationSchema = null;
        this._modificationSchema = null;

        this._systemFields = ['_id'];

        this._debug = null;

    }

    /**
     * set debug object
     *
     * @param {Request/Debug} debug
     */
    setDebug (debug) {
        this._debug = debug;
    }

    /**
     * create new document
     *
     * @param {Object} data
     * @param {Object} options
     * @return {Promise}
     */
    create (data, options) {

        return new Promise((resolve, reject) => {

            var timer = this._createTimer(this.entity + ':create');

            timer.data = {
                data: data,
                options: options
            };

            this._validate(data, this._creationSchema, options)
            .then((data) => {

                data.id = uuid.v4();
                data.creationDate = this._time();
                data.modificationDate = null;

                return this._model().insertOne(data);
            })
            .then((doc) => {
                timer.stop();
                resolve(doc);
            })
            .catch((error) => {
                timer.error(error);

                var ModelError = this._model().Error;

                if (ModelError.is(ModelError.CODES.ALREADY_EXISTS, error)) {
                    reject(
                        this.Error.createError(this.Error.CODES.ALREADY_EXISTS, error)
                        .bind({id: data.id})
                    );
                } else {
                    reject(ApiError.ensureError(error));
                }

            });

        });

    }

    /**
     * search documents
     *
     * @param {Object} filters
     * @param {Object} fields
     * @return {Chain}
     */
    find (filters, fields) {

        var timer = this._createTimer(this.entity + ':find');

        timer.data = {filters: filters, fields};

        var chain = new Chain({
            steps: {
                sort: null,
                limit: null,
                skip: null
            }
        });

        chain.onExec((data) => {

            timer.data.params = data;

            return new Promise((resolve, reject) => {

                this._model().find(filters, fields)
                    .mapToChain(data)
                    .exec()
                    .then((result) => {
                        timer.stop();
                        resolve(result);
                    })
                    .catch((error) => {
                        timer.error(error);
                        reject(error);
                    });

            });

        });

        return chain;
    }

    /**
     * search one document
     *
     * @param {Object} filters
     * @param {Object} fields
     * @return {Chain}
     */
    findOne (filters, fields) {

        var timer = this._createTimer(this.entity + ':findOne');

        timer.data = {
            filters: filters,
            fields: fields
        };

        var chain = new Chain({
            steps: {
                sort: null,
                limit: null,
                skip: null
            }
        });

        chain.onExec((options) => {
            timer.data.options = options;

            return new Promise((resolve, reject) => {

                options.fields = fields;

                this._model().findOne(filters, options)
                    .then((result) => {
                        timer.stop();
                        resolve(result);
                    })
                    .catch((error) => {
                        timer.error(error);
                        reject(error);
                    });

            });

        });

        return chain;

    }

    /**
     * get document by name
     *
     * @param {String} name
     * @param {Array} fields
     * @return {Promise}
     */
    getByName (name, fields) {

        return new Promise((resolve, reject) => {

            var timer = this._createTimer(this.entity + ':getByName');

            timer.data = {
                name: name,
                fields: fields
            };

            this.findOne({name: name}, fields).exec()
                .then((result) => {
                    timer.stop();
                    resolve(result);
                })
                .catch((error) => {
                    timer.error(error);
                    reject(error);
                });
        });

    }

    /**
     * get document by name
     *
     * @param {*} id
     * @param {Array} fields
     * @return {Promise}
     */
    getById (id, fields) {

        return new Promise((resolve, reject) => {

            var timer = this._createTimer(this.entity + ':getById');

            timer.data = {
                id: id,
                fields: fields
            };

            this.findOne({_id: id}, fields).exec()
                .then((result) => {
                    timer.stop();
                    resolve(result);
                })
                .catch((error) => {
                    timer.error(error);
                    reject(error);
                });

        });

    }

    /**
     * update document by name
     *
     * @param {String} name
     * @param {Object} data
     * @return {Promise}
     */
    updateByName (name, data) {

        return new Promise((resolve, reject) => {

            var timer = this._createTimer(this.entity + ':updateByName');

            timer.data = {
                name: name,
                data: data
            };

            var validData, doc;

            this._validate(data, this._modificationSchema)
            .then((data) => {

                if (this._isEmptyData(data)) {
                    return reject(new this.Error(this.Error.CODES.INVALID_DATA));
                }

                validData = data;

                return this._model().findOne({
                    name: name
                });
            })
            .then((_doc) => {

                doc = _doc;

                if (!doc) {
                    return reject(
                        new this.Error(this.Error.CODES.NOT_FOUND)
                    );
                }

                validData.modificationDate = this._time();

                return this._model().update(
                    {
                        name: name
                    },
                    {
                        '$set': validData
                    }
                );

            })
            .then(() => {
                timer.stop();
                var updated = _.defaultsDeep(validData, doc);
                resolve(updated);
            })
            .catch((error) => {
                timer.error(error);
                reject(error);
            });

        });

    }

    /**
     * update document by id
     *
     * @param {String} id
     * @param {Object} data
     * @return {Promise}
     */
    updateById (id, data) {

        return new Promise((resolve, reject) => {

            var timer = this._createTimer(this.entity + ':updateById');

            timer.data = {
                id: id,
                data: data
            };

            var validData, doc;

            this._validate(data, this._modificationSchema)
            .then((data) => {

                if (this._isEmptyData(data)) {
                    return reject(new this.Error(this.Error.CODES.INVALID_DATA));
                }

                validData = data;

                return this._model().findOne({
                    _id: id
                });
            })
            .then((_doc) => {

                doc = _doc;

                if (!doc) {
                    return reject(
                        new this.Error(this.Error.CODES.NOT_FOUND)
                    );
                }

                validData.modificationDate = this._time();

                return this._model().update(
                    {
                        _id: id
                    },
                    {
                        '$set': validData
                    }
                );

            })
            .then(() => {
                timer.stop();
                var updated = _.defaultsDeep(validData, doc);
                resolve(updated);
            })
            .catch((error) => {
                timer.error(error);
                reject(error);
            });

        });

    }

    /**
     * set api entity name
     *
     * @private
     * @param {String} name
     */
    _setEntityName (name) {
        this.entity = name;
        this.Error = this.Error.createWithEntityName(name);
    }

    /**
     * get api model
     *
     * @private
     * @return {Object}
     */
    _model () {

        if (!this._modelName) {
            throw new this.Error(this.Error.CODES.NO_MODEL_NAME);
        }

        if (!this._models[this._modelName]) {
            throw this.Error.createError(this.Error.CODES.NO_MODEL)
                .bind({name: this._modelName});
        }


        return this._models[this._modelName];
    }

    /**
     * emit debug data
     *
     * @private
     * @param  {Object} data
     */
    _logDebug (data) {

        if (!this._debug || !this._debug.log) {
            return;
        }

        this._debug.log(data);
    }

    /**
     * create debug timer
     *
     * @private
     * @param  {String} name
     * @return {DebugTimer}
     */
    _createTimer (name) {
        var timer = new DebugTimer('api', name);

        timer.onStop((data) => {
            this._logDebug(data);
        });

        return timer;
    }

}

module.exports = ApiAbstract;
