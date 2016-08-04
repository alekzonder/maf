'use strict';
var path = require('path');
var fs = require('fs-extra');
var _ = require('lodash');
var joi = require('joi');
var joiJsonSchema = require('joi-to-json-schema');
var jj = joiJsonSchema;

var chai = require('chai');
chai.use(require('chai-json-schema'));

var Engine = require('tingodb')();

var assert = chai.assert;


// init
var rootPath = path.resolve(__dirname + '/../../../..');
var tmpPath = rootPath + '/tests/tmp/Tingodb';

var logger = require('log4js').getLogger();


var ModelTingodb = require(rootPath + '/lib/Model/Tingodb');

class TestModel extends ModelTingodb {
    constructor(db) {
        super(db);
        this._collectionName = 'test';
    }
}

var model;

describe('Model/Tingodb', function() {

    beforeEach(function() {
        fs.removeSync(tmpPath);
        fs.mkdirsSync(tmpPath);

        var db = new Engine.Db(tmpPath, {});

        model = new TestModel(db);
        model.init();
    });

    describe('#insertOne', function() {

        it('insert success', function(done) {

            model.insertOne({
                    id: 1,
                    name: 'test'
                })
                .then((item) => {

                    assert.jsonSchema(item, jj(joi.object().keys({
                        _id: joi.number().required().valid(1),
                        id: joi.number().required().valid(1),
                        name: joi.string().required().valid('test')
                    })));

                    done();
                })
                .catch((error) => {
                    done(error);
                });

        });

        it('reject error on duplicate id', function(done) {
            var data = {
                id: 1,
                name: 'test'
            };

            model.insertOne(data)
                .then((item) => {
                    return model.insertOne(data);
                })
                .catch((error) => {
                    assert.equal(error.message, 'record with id = 1 already exists');
                    assert.equal(error.code, 'alreadyExists');
                    done();
                });
        });

    });

    describe('#findOneAndUpdate', function () {

        it('update success', function (done) {
            var data = {
                id: 1,
                name: 'test'
            };

            model.insertOne(data)
                .then((item) => {
                    return model.findOneAndUpdate(
                        {id: 1},
                        {$set: {name: '100'}}
                    );
                })
                .then((updated) => {
                    assert.jsonSchema(updated, jj(joi.object().keys({
                        _id: joi.number().required().valid(1),
                        id: joi.number().required().valid(1),
                        name: joi.string().required().valid('100')
                    })));

                    done();
                })
                .catch((error) => {
                    done(error);
                });
        });

        it('return null for unknown item update', function (done) {

            var data = {
                id: 1,
                name: 'test'
            };

            model.insertOne(data)
                .then((item) => {
                    return model.findOneAndUpdate(
                        {id: 2},
                        {$set: {name: '100'}}
                    );
                })
                .then((updated) => {
                    assert.equal(null, updated);

                    done();
                })
                .catch((error) => {
                    done(error);
                });
        });

    });

    describe('#findOne', function () {

        it('success', function (done) {
            var data = {
                id: 1,
                name: 'test'
            };

            model.insertOne(data)
                .then((item) => {

                    return model.findOne({name: 'test'});
                })
                .then((found) => {
                    assert.jsonSchema(found, jj(joi.object().keys({
                        _id: joi.number().required().valid(1),
                        id: joi.number().required().valid(1),
                        name: joi.string().required().valid('test')
                    })));

                    done();
                })
                .catch((error) => {
                    done(error);
                });
        });


        it('found nothing', function (done) {
            var data = {
                id: 1,
                name: 'test'
            };

            model.insertOne(data)
                .then((item) => {

                    return model.findOne({name: '2'});
                })
                .then((found) => {

                    assert.equal(null, found);

                    done();
                })
                .catch((error) => {
                    done(error);
                });
        });

    });


    describe('#findOneById', function () {

        it('success', function (done) {
            var data = {
                id: 1,
                name: 'test'
            };

            model.insertOne(data)
                .then((item) => {

                    return model.findOneById(1);
                })
                .then((found) => {
                    assert.jsonSchema(found, jj(joi.object().keys({
                        _id: joi.number().required().valid(1),
                        id: joi.number().required().valid(1),
                        name: joi.string().required().valid('test')
                    })));

                    done();
                })
                .catch((error) => {
                    done(error);
                });
        });


        it('found nothing', function (done) {
            var data = {
                id: 1,
                name: 'test'
            };

            model.insertOne(data)
                .then((item) => {

                    return model.findOneById(2);
                })
                .then((found) => {

                    assert.equal(null, found);

                    done();
                })
                .catch((error) => {
                    done(error);
                });
        });

    });

    describe('#find', function () {

        it('success', function (done) {
            var data = [
                {
                    id: 1,
                    name: 'test',
                    group: 1
                },
                {
                    id: 2,
                    name: 'test2',
                    group: 1
                }
            ];

            Promise.all([
                model.insertOne(data[0]),
                model.insertOne(data[1])
            ])
                .then(() => {
                    return model.find({group: 1}).exec();
                })
                .then((result) => {

                    var schema = joi.object().keys({
                        total: joi.number().required().valid(2),
                        docs: joi.array().items({
                            _id: joi.number().required().valid([1,2]),
                            id: joi.number().required().valid([1,2]),
                            name: joi.string().required().valid(['test', 'test2']),
                            group: joi.number().required().valid(1)
                        }).length(2)
                    });

                    assert.jsonSchema(result, jj(schema));

                    done();
                })
                .catch((error) => {
                    done(error);
                });
        });

        it('found nothing', function (done) {

            model.find({group: 1}).exec()
                .then((result) => {

                    assert.jsonSchema(result, jj(joi.object().keys({
                        total: joi.number().required().valid(0),
                        docs: joi.array().length(0)
                    })));

                    done();
                })
                .catch((error) => {
                    done(error);
                });
        });


        // TODO sort, limit ... other chain methods

    });

    describe('#update', function () {

        it('update one success', function (done) {
            var data = [
                {
                    id: 1,
                    name: 'test',
                    group: 1
                },
                {
                    id: 2,
                    name: 'test2',
                    group: 1
                }
            ];

            Promise.all([
                model.insertOne(data[0]),
                model.insertOne(data[1])
            ])
                .then((item) => {
                    return model.update(
                        {id: 1},
                        {$set: {name: '100'}}
                    );
                })
                .then((updateCount) => {
                    assert.equal(1, updateCount);
                    done();
                })
                .catch((error) => {
                    done(error);
                });
        });

        it('update multi success', function (done) {
            var data = [
                {
                    id: 1,
                    name: 'test',
                    group: 1
                },
                {
                    id: 2,
                    name: 'test2',
                    group: 1
                }
            ];

            Promise.all([
                model.insertOne(data[0]),
                model.insertOne(data[1])
            ])
                .then((item) => {
                    return model.update(
                        {group: 1},
                        {$set: {name: '100'}},
                        {multi: true}
                    );
                })
                .then((updateCount) => {
                    assert.equal(2, updateCount);
                    done();
                })
                .catch((error) => {
                    done(error);
                });
        });

        it('nothing update', function (done) {

            var data = {
                id: 1,
                name: 'test'
            };

            model.insertOne(data)
                .then((item) => {
                    return model.update(
                        {group: 100500},
                        {$set: {name: '100'}},
                        {multi: true}
                    );
                })
                .then((cnt) => {
                    assert.equal(0, cnt);

                    done();
                })
                .catch((error) => {
                    done(error);
                });
        });

    });

    describe('#remove', function () {

        it('success', function (done) {
            var data = [
                {
                    id: 1,
                    name: 'test',
                    group: 1
                },
                {
                    id: 2,
                    name: 'test2',
                    group: 1
                }
            ];

            Promise.all([
                model.insertOne(data[0]),
                model.insertOne(data[1])
            ])
                .then((item) => {
                    return model.remove({group: 1});
                })
                .then((cnt) => {
                    assert.equal(2, cnt);
                    done();
                })
                .catch((error) => {
                    done(error);
                });
        });

        it('success single', function (done) {
            var data = [
                {
                    id: 1,
                    name: 'test',
                    group: 1
                },
                {
                    id: 2,
                    name: 'test2',
                    group: 1
                }
            ];

            Promise.all([
                model.insertOne(data[0]),
                model.insertOne(data[1])
            ])
                .then((item) => {
                    return model.removeOne({group: 1});
                })
                .then((cnt) => {
                    assert.equal(1, cnt);
                    done();
                })
                .catch((error) => {
                    done(error);
                });
        });

        it('found nothing', function (done) {

            model.remove({group: 100})
                .then((cnt) => {
                    assert.equal(0, cnt);
                    done();
                })
                .catch((error) => {
                    done(error);
                });
        });

    });


    describe('#count', function () {

        it('success 2', function (done) {
            var data = [
                {
                    id: 1,
                    name: 'test',
                    group: 1
                },
                {
                    id: 2,
                    name: 'test2',
                    group: 1
                }
            ];

            Promise.all([
                model.insertOne(data[0]),
                model.insertOne(data[1])
            ])
                .then(() => {
                    return model.count({group: 1});
                })
                .then((cnt) => {
                    assert.equal(2, cnt);
                    done();
                })
                .catch((error) => {
                    done(error);
                });
        });

        it('success 1', function (done) {
            var data = [
                {
                    id: 1,
                    name: 'test',
                    group: 1
                },
                {
                    id: 2,
                    name: 'test2',
                    group: 2
                }
            ];

            Promise.all([
                model.insertOne(data[0]),
                model.insertOne(data[1])
            ])
                .then(() => {
                    return model.count({group: 1});
                })
                .then((cnt) => {
                    assert.equal(1, cnt);
                    done();
                })
                .catch((error) => {
                    done(error);
                });
        });

        it('nothing found', function (done) {
            model.count({group: 1})
                .then((cnt) => {
                    assert.equal(0, cnt);
                    done();
                })
                .catch((error) => {
                    done(error);
                });
        });

    });

    describe('#aggregate', function () {

        it('not implemented', function (done) {
            model.aggregate()
                .then((result) => {
                    done(1);
                })
                .catch((error) => {
                    done();
                });
        });
    });

    describe('#ensureIndexes', function () {

        class ModelTestIndexes extends ModelTingodb {

            constructor(db) {
                super(db);
                this._collectionName = 'test';
                this._indexes = [
                    {
                        fields: {
                            name: 1
                        },
                        options: {
                            name: 'name',
                            unique: true,
                            background: true
                        }
                    },
                    {
                        fields: {
                            id: 1
                        }
                    }
                ];
            }

        }

        it('no indexes', function (done) {
            model.ensureIndexes()
                .then((data) => {
                    assert.deepEqual({collection: 'test', indexes: []}, data);
                    done();
                })
                .catch((error) => {
                    done(error);
                });
        });

        it('ensure indexes success', function (done) {

            var db = new Engine.Db(tmpPath, {});

            var model = new ModelTestIndexes(db);
            model.init();

            model.ensureIndexes()
                .then((data) => {
                    assert.deepEqual({collection: 'test', indexes: ['name', 'id_1']}, data);
                    done();
                })
                .catch((error) => {
                    done(error);
                });

        });

    });


});
