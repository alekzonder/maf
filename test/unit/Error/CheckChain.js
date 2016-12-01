/* eslint-disable */

var path = require('path');

var CheckChain = require(path.resolve(`${__dirname}/../../../src/Error/CheckChain`));

var assert = require('chai').assert;

var createTestError = function (en) {
    var error = new Error('msg');
    error.code = 'code';
    error.entity = 'entity';
    return error;
};

var createCheckChain = function () {
    var checkChain = new CheckChain(createTestError());

    return checkChain;
};

describe('Error/CheckChain', function () {

    describe('#creation', function () {

        it('should use default callback', function (done) {

            var checkChain = createCheckChain();

            checkChain.setDefault(x => done());

            checkChain.check();

        });

        it('should throw error if no default callback', function (done) {

            var checkChain = createCheckChain();

            try {
                checkChain.check();
            } catch (e) {
                assert.equal(e.message, 'ErrorCheckChain: no default callback function');
                done();
            }
        });

    });


    describe('#ifCode', function () {

        it('should use callback', function (done) {
            var checkChain = createCheckChain();

            checkChain.setDefault(function (error) {
                done(new Error('not here'));
            });

            checkChain.ifCode('notNowCode', function (error) {
                done(new Error('not here'));
            });

            checkChain.ifCode('code', function (error) {
                assert.equal(error.code, 'code');
                done();
            });

            checkChain.check();
        });


        it('should throw error if no args', function (done) {
            var checkChain = createCheckChain();

            try {
                checkChain.setDefault(function (error) {
                    done(new Error('not here'));
                })
                .ifCode()
                .check();
            } catch (e) {
                assert.equal(e.message, 'ErrorCheckChain: fn argument must be a function');
                done();
            }

        });

        it('should throw error if no callback arg', function (done) {
            var checkChain = createCheckChain();

            try {
                checkChain.setDefault(function (error) {
                    done(new Error('not here'));
                })
                .ifCode('test')
                .check();
            } catch (e) {
                assert.equal(e.message, 'ErrorCheckChain: fn argument must be a function');
                done();
            }

        });

        it('should throw error if callback no a function', function (done) {
            var checkChain = createCheckChain();

            try {
                checkChain.setDefault(function (error) {
                    done(new Error('not here'));
                })
                .ifCode('test', '123')
                .check();
            } catch (e) {
                assert.equal(e.message, 'ErrorCheckChain: fn argument must be a function');
                done();
            }

        });

    });



    describe('#ifEntity', function () {

        it('should success check entity', function (done) {
            var checkChain = createCheckChain();

            checkChain.setDefault(function (error) {
                done(new Error('not here'));
            })
            .ifEntity('entity')
            .ifCode('code', function (error) {
                assert.equal(error.code, 'code');
                assert.equal(error.entity, 'entity');
                done();
            })
            .check();
        });

        it('should error if entity not string', function (done) {
            var checkChain = createCheckChain();

            try {
                checkChain.setDefault(function (error) {
                    done(new Error('not here'));
                })
                .ifEntity(123)
                .check();
            } catch (e) {
                assert.equal(e.message, 'ErrorCheckChain: entity argument must be a string');
                done();
            }

        });
    });

});
