/// <reference path="../../../tools/typings/jasmine/jasmine.d.ts" />
/// <reference path="../../typings/jasmine-utils.d.ts" />
/// <reference path="../../../dist/automapper-classes.d.ts" />
/// <reference path="../../../dist/automapper-interfaces.d.ts" />
/// <reference path="../../../dist/automapper-declaration.d.ts" />
var globalScope = this;
var AutoMapperJs;
(function (AutoMapperJs) {
    describe('AutoMapper (asynchronous mapping)', function () {
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
                var func = function (opts, cb) {
                    cb(opts.intermediatePropertyValue + ' (async)');
                };
                // do something asynchronous
                setTimeout(func(opts, cb), 100);
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
        it('should fail when mapping an asynchronous mapping using synchronous map function', function () {
            // arrange
            var objFrom = { prop: 'prop' };
            var fromKey = 'async-forMember-';
            var toKey = 'valid-1';
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop', function (opts, cb) {
                var func = function (opts, cb) {
                    cb(opts.intermediatePropertyValue + ' (async)');
                };
                // do something asynchronous
                setTimeout(func(opts, cb), 100);
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
            var fromKey = 'async-forMember-';
            var toKey = 'valid-1';
            automapper
                .createMap(fromKey, toKey)
                .forSourceMember('prop', function (opts, cb) {
                var func = function (opts, cb) {
                    cb('AsyncValue');
                };
                // do something asynchronous
                setTimeout(func(opts, cb), 100);
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
                .convertUsing(function (ctx, cb) {
                var func = function (ctx, cb) {
                    var res = { propA: ctx.sourceValue.propA + ' (custom async mapped with resolution context)' };
                    cb(res);
                };
                // do something asynchronous
                setTimeout(func(ctx, cb), 100);
            });
            // act
            automapper.mapAsync(fromKey, toKey, objA, function (result) {
                // assert
                expect(result.propA).toEqual(objA.propA + ' (custom async mapped with resolution context)');
                done();
            });
        });
    });
})(AutoMapperJs || (AutoMapperJs = {}));
