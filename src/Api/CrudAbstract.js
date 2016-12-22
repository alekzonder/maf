var path = require('path');

var uuid = require(path.resolve(__dirname, '../vendors/uuid'));

var Abstract = require('./Abstract');

var ApiError = require('./Error');

var BaseCrudError = ApiError.extendCodes({
    NO_MODEL_NAME: 'maf/Api/CrudAbstract: no model name in constructor',
    NO_MODEL: 'maf/Api/CrudAbstract: no model with name = %name%'
});


class CrudAbstract extends Abstract {

    constructor (models, api, modelName) {
        super(models, api);

        this.entity = null;

        this.Error = BaseCrudError;

        this._modelName = modelName;

        this._creationSchema = null;
        this._modificationSchema = null;

        this._systemFields = [
            '_id'
        ];

    }

    create (data, options) {

        return new Promise((resolve, reject) => {

            this._validate(data, this._creationSchema, options)
            .then((data) => {

                data.id = uuid.v4();
                data.creationDate = this._time();
                data.modificationDate = null;

                return this._model().insertOne(data);
            })
            .then((doc) => {
                resolve(doc);
            })
            .catch((error) => {

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


}

module.exports = CrudAbstract;
