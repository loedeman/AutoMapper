/// <reference path="../../../tools/typings/jasmine/jasmine.d.ts" />
/// <reference path="../../typings/jasmine-utils.d.ts" />
/// <reference path="../../../dist/automapper-classes.d.ts" />
/// <reference path="../../../dist/automapper-interfaces.d.ts" />
/// <reference path="../../../dist/automapper-declaration.d.ts" />
var globalScope = this;
var AutoMapperJs;
(function (AutoMapperJs) {
    'use strict';
    describe('AutoMapper - Currying support', function () {
        beforeEach(function () {
            utils.registerTools(globalScope);
            utils.registerCustomMatchers(globalScope);
        });
        it('should be able to use currying when calling createMap', function () {
            // arrange
            var fromKey = '{808D9D7F-AA89-4D07-917E-A528F055EE64}';
            var toKey1 = '{B364C0A0-9E24-4424-A569-A4C14101947C}';
            var toKey2 = '{1055CA5A-4FC4-44CB-B4D8-B004F43D8840}';
            var source = { prop: 'Value' };
            // act
            var mapFromKeyCurry = automapper.createMap(fromKey);
            mapFromKeyCurry(toKey1)
                .forSourceMember('prop', function (opts) { opts.ignore(); });
            mapFromKeyCurry(toKey2);
            var result1 = automapper.map(fromKey, toKey1, source);
            var result2 = automapper.map(fromKey, toKey2, source);
            // assert
            expect(typeof mapFromKeyCurry === 'function').toBeTruthy();
            expect(result1.prop).toBeUndefined();
            expect(result2.prop).toEqual(source.prop);
        });
        it('should be able to use currying (one parameter) when calling map', function () {
            // arrange
            var fromKey = 'should be able to use currying (one parameter)';
            var toKey1 = 'when calling map (1)';
            var toKey2 = 'when calling map (2)';
            var source = { prop: 'Value' };
            // act
            var createMapFromKeyCurry = automapper.createMap(fromKey);
            createMapFromKeyCurry(toKey1)
                .forSourceMember('prop', function (opts) { opts.ignore(); });
            createMapFromKeyCurry(toKey2);
            var result1MapCurry = automapper.map(fromKey);
            var result2MapCurry = automapper.map(fromKey);
            var result1 = result1MapCurry(toKey1, source);
            var result2 = result2MapCurry(toKey2, source);
            // assert
            expect(typeof createMapFromKeyCurry === 'function').toBeTruthy();
            expect(typeof result1MapCurry === 'function').toBeTruthy();
            expect(typeof result2MapCurry === 'function').toBeTruthy();
            expect(result1.prop).toBeUndefined();
            expect(result2.prop).toEqual(source.prop);
        });
        it('should be able to use currying when calling map', function () {
            // arrange
            var fromKey = '{FC18523B-5A7C-4193-B938-B6AA2EABB37A}';
            var toKey1 = '{609202F4-15F7-4512-9178-CFAF073800E1}';
            var toKey2 = '{85096AE2-92FB-43D7-8FC3-EC14DDC1DFDD}';
            var source = { prop: 'Value' };
            // act
            var createMapFromKeyCurry = automapper.createMap(fromKey);
            createMapFromKeyCurry(toKey1)
                .forSourceMember('prop', function (opts) { opts.ignore(); });
            createMapFromKeyCurry(toKey2);
            var result1MapCurry = automapper.map(fromKey, toKey1);
            var result2MapCurry = automapper.map(fromKey, toKey2);
            var result1 = result1MapCurry(source);
            var result2 = result2MapCurry(source);
            // assert
            expect(typeof createMapFromKeyCurry === 'function').toBeTruthy();
            expect(typeof result1MapCurry === 'function').toBeTruthy();
            expect(typeof result2MapCurry === 'function').toBeTruthy();
            expect(result1.prop).toBeUndefined();
            expect(result2.prop).toEqual(source.prop);
        });
        it('should be able to use currying when calling mapAsync', function (done) {
            // arrange
            var fromKey = '{1CA8523C-5A7C-4193-B938-B6AA2EABB37A}';
            var toKey1 = '{409212FD-15E7-4512-9178-CFAF073800EG}';
            var toKey2 = '{85096AE2-92FA-43N7-8FA3-EC14DDC1DFDE}';
            var source = { prop: 'Value' };
            // act
            var createMapFromKeyCurry = automapper.createMap(fromKey);
            createMapFromKeyCurry(toKey1)
                .forSourceMember('prop', function (opts, cb) { cb('Constant Value 1'); });
            createMapFromKeyCurry(toKey2)
                .forMember('prop', function (opts, cb) { cb('Constant Value 2'); });
            var result1MapCurry = automapper.mapAsync(fromKey, toKey1);
            var result2MapCurry = automapper.mapAsync(fromKey, toKey2);
            // assert
            expect(typeof createMapFromKeyCurry === 'function').toBeTruthy();
            expect(typeof result1MapCurry === 'function').toBeTruthy();
            expect(typeof result2MapCurry === 'function').toBeTruthy();
            var resCount = 0;
            var result1 = result1MapCurry(source, function (result) {
                // assert
                expect(result.prop).toEqual('Constant Value 1');
                if (++resCount === 2) {
                    done();
                }
            });
            var result2 = result2MapCurry(source, function (result) {
                // assert
                expect(result.prop).toEqual('Constant Value 2');
                if (++resCount === 2) {
                    done();
                }
            });
        });
        it('should be able to use currying when calling mapAsync with one parameter', function (done) {
            // arrange
            var fromKey = '{1CA8523C-5AVC-4193-BS38-B6AA2EABB37A}';
            var toKey = '{409212FD-1527-4512-9178-CFAG073800EG}';
            var source = { prop: 'Value' };
            // act
            automapper.createMap(fromKey, toKey)
                .forSourceMember('prop', function (opts, cb) { cb('Constant Value'); });
            var mapAsyncCurry = automapper.mapAsync(fromKey);
            // assert
            expect(typeof mapAsyncCurry === 'function').toBeTruthy();
            var result = mapAsyncCurry(toKey, source, function (result) {
                // assert
                expect(result.prop).toEqual('Constant Value');
                done();
            });
        });
        it('should be able to use currying when calling mapAsync with two parameters', function (done) {
            // arrange
            var fromKey = '{1CA852SC-5AVC-4193-BS38-B6AA2KABB3LA}';
            var toKey = '{409212FD-1Q27-45G2-9178-CFAG073800EG}';
            var source = { prop: 'Value' };
            // act
            automapper.createMap(fromKey, toKey)
                .forMember('prop', function (opts, cb) { cb('Constant Value'); });
            var mapAsyncCurry = automapper.mapAsync(fromKey, toKey);
            // assert
            expect(typeof mapAsyncCurry === 'function').toBeTruthy();
            var result = mapAsyncCurry(source, function (result) {
                // assert
                expect(result.prop).toEqual('Constant Value');
                done();
            });
        });
        it('should be able to use currying when calling mapAsync with three parameters', function (done) {
            // NOTE BL 20151214 I wonder why anyone would like calling this one? Maybe this one will be removed in
            //                  the future. Please get in touch if you need this one to stay in place...
            // arrange
            var fromKey = '{1CA852SC-5AVC-ZZ93-BS38-B6AA2KABB3LA}';
            var toKey = '{409212FD-1Q27-45G2-91BB-CFAG0738WCEG}';
            var source = { prop: 'Value' };
            // act
            automapper.createMap(fromKey, toKey)
                .forMember('prop', function (opts, cb) { cb('Constant Value'); });
            var mapAsyncCurry = automapper.mapAsync(fromKey, toKey, source);
            // assert
            expect(typeof mapAsyncCurry === 'function').toBeTruthy();
            var result = mapAsyncCurry(function (result) {
                // assert
                expect(result.prop).toEqual('Constant Value');
                done();
            });
        });
        it('should fail when calling mapAsync without parameters', function () {
            // arrange
            // act
            try {
                var mapAsyncCurry = automapper.mapAsync();
            }
            catch (e) {
                // assert
                expect(e.message).toEqual('The mapAsync function expects between 1 and 4 parameters, you provided 0.');
                return;
            }
            // assert
            expect(null).fail('Expected error was not raised.');
        });
        it('should fail when calling mapAsync with > 4 parameters', function () {
            // arrange
            // act
            try {
                var mapAsyncCurry = automapper.mapAsync(undefined, undefined, undefined, undefined, undefined);
            }
            catch (e) {
                // assert
                expect(e.message).toEqual('The mapAsync function expects between 1 and 4 parameters, you provided 5.');
                return;
            }
            // assert
            expect(null).fail('Expected error was not raised.');
        });
        it('should fail when specifying < 2 parameters to the asynchronous map function', function () {
            // arrange
            // act
            try {
                new AutoMapperJs.AsyncAutoMapper().map(undefined);
            }
            catch (e) {
                // assert
                expect(e.message).toEqual('The AsyncAutoMapper.map function expects between 2 and 5 parameters, you provided 1.');
                return;
            }
            // assert
            expect(null).fail('Expected error was not raised.');
        });
        it('should fail when specifying > 5 parameters to the asynchronous map function', function () {
            // arrange
            // act
            try {
                new AutoMapperJs.AsyncAutoMapper().map(undefined, undefined, undefined, undefined, undefined, undefined);
            }
            catch (e) {
                // assert
                expect(e.message).toEqual('The AsyncAutoMapper.map function expects between 2 and 5 parameters, you provided 6.');
                return;
            }
            // assert
            expect(null).fail('Expected error was not raised.');
        });
    });
})(AutoMapperJs || (AutoMapperJs = {}));
