/// <reference path="../../../tools/typings/jasmine/jasmine.d.ts" />
/// <reference path="../../typings/jasmine-utils.d.ts" />
/// <reference path="../../../dist/arcady-automapper-classes.d.ts" />
/// <reference path="../../../dist/arcady-automapper-interfaces.d.ts" />
/// <reference path="../../../dist/arcady-automapper-declaration.d.ts" />
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
                // do something asynchronous
                setTimeout(function () {
                    cb(opts.intermediatePropertyValue + ' (async)');
                }, 100);
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
                // do something asynchronous
                setTimeout(function () {
                    cb(opts.intermediatePropertyValue + ' (async)');
                }, 100);
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
        it('should be able to map asynchronous using forSourceMember', function () {
            var objFrom = { prop: 'prop' };
            var fromKey = 'async-forMember-';
            var toKey = 'valid-1';
            automapper
                .createMap(fromKey, toKey)
                .forSourceMember('prop', function (opts, cb) {
                // do something asynchronous
                setTimeout(function () {
                    cb('AsyncValue');
                }, 100);
            });
        });
    });
})(AutoMapperJs || (AutoMapperJs = {}));
