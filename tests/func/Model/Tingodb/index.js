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


var TingoModel = require(rootPath + '/lib/Model/Tingodb');

class TestModel extends TingoModel {
    constructor(db) {
        super(db);
        this._collectionName = 'test';
    }
}

var db = new Engine.Db(tmpPath, {});

var model;

describe('Model/Tingodb', function() {

    beforeEach(function() {
        fs.removeSync(tmpPath);
        fs.mkdirsSync(tmpPath);
        model = new TestModel(db);
        model.init();
    });

    describe('#insertOne', function() {

        it('should success insert', function(done) {

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

        it('should error on duplicate id', function(done) {
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



});