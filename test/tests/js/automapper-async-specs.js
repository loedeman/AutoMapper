/// <reference path="../../../tools/typings/jasmine/jasmine.d.ts" />
/// <reference path="../../typings/jasmine-utils.d.ts" />
/// <reference path="../../../dist/automapper-classes.d.ts" />
/// <reference path="../../../dist/automapper-interfaces.d.ts" />
/// <reference path="../../../dist/automapper-declaration.d.ts" />
var globalScope = this;
var AutoMapperJs;
(function (AutoMapperJs) {
    'use strict';
    describe('AutoMapper (asynchronous mapping)', function () {
        var postfix = ' [f0e5ef4a-ebe1-47c4-a3ff-48f8b5ae6ac7]';
        beforeEach(function () {
            utils.registerTools(globalScope);
            utils.registerCustomMatchers(globalScope);
        });
        it('should be able to map asynchronous using forMember', function (done) {
            // arrange
            var objFrom = { prop: 'prop' };
            var fromKey = 'async-forMember-';
            var toKey = 'valid-1';
            // act
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop', function (opts, cb) {
                var func = function (o, c) {
                    c(o.intermediatePropertyValue + ' (async)');
                };
                // do something asynchronous
                setTimeout(function () {
                    func(opts, cb);
                }, 10);
            })
                .forMember('prop', function (opts) {
                return opts.intermediatePropertyValue + ' (sync)';
            });
            automapper.mapAsync(fromKey, toKey, objFrom, function (result) {
                // assert
                expect(result.prop).toEqual(objFrom.prop + ' (async)' + ' (sync)');
                done();
            });
        });
        it('should be able to map asynchronous using forMember in combination with a constant value', function (done) {
            // arrange
            var objFrom = { prop: 'prop' };
            var fromKey = 'async-forMember-';
            var toKey = 'valid-2';
            // act
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop', function (opts, cb) {
                var func = function (o, c) {
                    c(o.intermediatePropertyValue + ' (async)');
                };
                // do something asynchronous
                setTimeout(function () {
                    func(opts, cb);
                }, 10);
            })
                .forMember('prop', 'Async With Constant Value');
            automapper.mapAsync(fromKey, toKey, objFrom, function (result) {
                // assert
                expect(result.prop).toEqual('Async With Constant Value');
                done();
            });
        });
        it('should be able to map asynchronous using an asynchronous forMember in combination with a synchronous forMember mapping', function (done) {
            // arrange
            var objFrom = { prop1: 'prop1', prop2: 'prop2' };
            var fromKey = 'async-forMember-';
            var toKey = 'valid-3';
            // act
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop1', function (opts, cb) {
                var func = function (o, c) {
                    c(o.intermediatePropertyValue + ' (async)');
                };
                // do something asynchronous
                setTimeout(function () {
                    func(opts, cb);
                }, 10);
            })
                .forMember('prop2', function (opts) { return opts.intermediatePropertyValue; });
            automapper.mapAsync(fromKey, toKey, objFrom, function (result) {
                // assert
                expect(result.prop1).toEqual(objFrom.prop1 + ' (async)');
                expect(result.prop2).toEqual(objFrom.prop2);
                done();
            });
        });
        it('should fail when mapping an asynchronous mapping using synchronous map function', function () {
            // arrange
            var objFrom = { prop: 'prop' };
            var fromKey = 'async-forMember-';
            var toKey = 'invalid-1';
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop', function (opts, cb) {
                var func = function (o, c) {
                    c(o.intermediatePropertyValue + ' (async)');
                };
                // do something asynchronous
                setTimeout(function () {
                    func(opts, cb);
                }, 10);
            })
                .forMember('prop', function (opts) {
                return opts.intermediatePropertyValue + ' (sync)';
            });
            // act
            try {
                var objB = automapper.map(fromKey, toKey, objFrom);
            }
            catch (e) {
                // assert
                expect(e.message).toEqual('Impossible to use asynchronous mapping using automapper.map(); use automapper.mapAsync() instead.');
                return;
            }
            // assert
            expect(null).fail('Expected error was not raised.');
        });
        it('should be able to map asynchronous using forSourceMember', function (done) {
            // arrange
            var objFrom = { prop: 'prop' };
            var fromKey = 'async-forSourceMember-';
            var toKey = 'valid-1';
            automapper
                .createMap(fromKey, toKey)
                .forSourceMember('prop', function (opts, cb) {
                var func = function (o, c) {
                    c('AsyncValue');
                };
                // do something asynchronous
                setTimeout(function () {
                    func(opts, cb);
                }, 10);
            });
            // act
            automapper.mapAsync(fromKey, toKey, objFrom, function (result) {
                // assert
                expect(result.prop).toEqual('AsyncValue');
                done();
            });
        });
        it('should be able to use convertUsing to map an object with a custom asynchronous type resolver function', function (done) {
            var objA = { propA: 'propA' };
            var fromKey = '{D1534A0F-6120-475E-B7E2-BF2489C58571}';
            var toKey = '{1896FF99-1A28-4FE6-800B-072D5616B02D}';
            automapper
                .createMap(fromKey, toKey)
                .convertUsing(function (opts, cb) {
                var func = function (o, c) {
                    var res = { propA: o.sourceValue.propA + ' (custom async mapped with resolution context)' };
                    c(res);
                };
                // do something asynchronous
                setTimeout(function () {
                    func(opts, cb);
                }, 10);
            });
            // act
            automapper.mapAsync(fromKey, toKey, objA, function (result) {
                // assert
                expect(result.propA).toEqual(objA.propA + ' (custom async mapped with resolution context)');
                done();
            });
        });
        it('should asynchronously map an array', function (done) {
            // arrange
            var arrA = [{ prop1: 'From A', prop2: 'From A too' }];
            var fromKey = '{60D9DGH6-DSEC-48GF-9BAC-0805FCAF91B7}';
            var toKey = '{AC6D5B97-9AE3-BERT-ZB60-AZFEDZXE541A}';
            automapper.createMap(fromKey, toKey)
                .forMember('prop1', function (opts, cb) {
                var func = function (o, c) {
                    c(o.intermediatePropertyValue);
                };
                // do something asynchronous
                setTimeout(function () {
                    func(opts, cb);
                }, 10);
            });
            // act
            var arrB = automapper.mapAsync(fromKey, toKey, arrA, function (result) {
                // assert
                expect(result).toEqualData(arrA);
                done();
            });
        });
        it('should be able to map asynchronously using forMember for nested mapping and mapFrom', function (done) {
            // arrange
            var objA = { srcLevel1: { srcLevel2: 'value' } };
            var fromKey = 'should be able to map asynchronously using ';
            var toKey = 'forMember for nested mapping and mapFrom' + postfix;
            var mapFromFunc = function (opts) { return opts.mapFrom('srcLevel1.srcLevel2'); };
            // act
            automapper
                .createMap(fromKey, toKey)
                .forMember('dstLevel1.dstLevel2', mapFromFunc)
                .forMember('dstLevel1.dstLevel2', function (opts, cb) {
                var func = function (o, c) {
                    c(o.intermediatePropertyValue);
                };
                // do something asynchronous
                setTimeout(function () {
                    func(opts, cb);
                }, 10);
            });
            automapper.mapAsync(fromKey, toKey, objA, function (objB) {
                // assert
                expect(objB).toEqualData({ dstLevel1: { dstLevel2: 'value' } });
                done();
            });
        });
        it('should be able to map asynchronously using forMember and ignore a member using forSourceMember', function (done) {
            // arrange
            var objA = { prop1: 'value1', prop2: 'value2' };
            var fromKey = 'should be able to map asynchronously using ';
            var toKey = 'forMember and ignore a member using forSourceMember' + postfix;
            var ignoreFunc = function (opts) { return opts.ignore(); };
            // act
            automapper
                .createMap(fromKey, toKey)
                .forSourceMember('prop1', ignoreFunc)
                .forMember('prop2', function (opts, cb) {
                var func = function (o, c) {
                    c(o.intermediatePropertyValue);
                };
                // do something asynchronous
                setTimeout(function () {
                    func(opts, cb);
                }, 10);
            });
            automapper.mapAsync(fromKey, toKey, objA, function (objB) {
                // assert
                expect(objB).toEqualData({ prop2: 'value2' });
                done();
            });
        });
        it('should be able to map asynchronously using forMember and still convert a member using sync forSourceMember', function (done) {
            // arrange
            var objA = { prop1: 'value1', prop2: 'value2' };
            var fromKey = 'should be able to map asynchronously using ';
            var toKey = 'forMember and still convert a member using sync forSourceMember' + postfix;
            // act
            automapper
                .createMap(fromKey, toKey)
                .forSourceMember('prop1', function (opts) { return opts.intermediatePropertyValue + ' (sync)'; })
                .forMember('prop2', function (opts, cb) {
                var func = function (o, c) {
                    c(o.intermediatePropertyValue);
                };
                // do something asynchronous
                setTimeout(function () {
                    func(opts, cb);
                }, 10);
            });
            automapper.mapAsync(fromKey, toKey, objA, function (objB) {
                // assert
                expect(objB).toEqualData({ prop1: objA.prop1 + ' (sync)', prop2: objA.prop2 });
                done();
            });
        });
        it('should be able to map asynchronously using a null source value', function (done) {
            // arrange
            var fromKey = 'should be able to map asynchronously ';
            var toKey = 'using a null source value' + postfix;
            // act
            automapper
                .createMap(fromKey, toKey)
                .forSourceMember('prop1', function (opts) { return opts.intermediatePropertyValue; })
                .forMember('prop2', function (opts) { return opts.intermediatePropertyValue; })
                .forMember('prop3', function (opts, cb) {
                var func = function (o, c) {
                    c(o.intermediatePropertyValue);
                };
                // do something asynchronous
                setTimeout(function () {
                    func(opts, cb);
                }, 10);
            })
                .forSourceMember('prop3', function (opts, cb) {
                var func = function (o, c) {
                    c(o.intermediatePropertyValue);
                };
                // do something asynchronous
                setTimeout(function () {
                    func(opts, cb);
                }, 10);
            });
            automapper.mapAsync(fromKey, toKey, undefined, function (objB) {
                // assert
                expect(objB).toEqualData({});
                done();
            });
        });
    });
})(AutoMapperJs || (AutoMapperJs = {}));
