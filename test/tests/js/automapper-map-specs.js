/// <reference path="../../../tools/typings/jasmine/jasmine.d.ts" />
/// <reference path="../../typings/jasmine-utils.d.ts" />
/// <reference path="../../../dist/automapper-classes.d.ts" />
/// <reference path="../../../dist/automapper-interfaces.d.ts" />
/// <reference path="../../../dist/automapper-declaration.d.ts" />
var globalScope = this;
var AutoMapperJs;
(function (AutoMapperJs) {
    describe('AutoMapper', function () {
        beforeEach(function () {
            utils.registerTools(globalScope);
            utils.registerCustomMatchers(globalScope);
        });
        it('should auto map matching properties', function () {
            // arrange
            var objA = { prop1: 'From A', prop2: 'From A too' };
            var fromKey = '{7F5AF9AC-2E9E-4676-8BE1-3E72866B11E8}';
            var toKey = '{8089EBDC-3BBB-4988-95F2-683CC1AD23A3}';
            automapper.createMap(fromKey, toKey);
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB).toEqualData(objA);
        });
        it('should map an array', function () {
            // arrange
            var arrA = [{ prop1: 'From A', prop2: 'From A too' }];
            var fromKey = '{60D9DB56-D6E1-48FF-9BAC-0805FCAF91B7}';
            var toKey = '{AC6D5B97-9AE3-4267-BD60-A5FED17E541A}';
            automapper.createMap(fromKey, toKey);
            // act
            var arrB = automapper.map(fromKey, toKey, arrA);
            // assert
            expect(arrB).toEqualData(arrA);
        });
        it('should map an array and handle empty items', function () {
            // arrange
            var arrA = [{ prop1: 'From A', prop2: 'From A too' }, undefined];
            var fromKey = '{60D9DB56-D6E1-48FF-9BAC-0805FCAF91B7}';
            var toKey = '{AC6D5B97-9AE3-4267-BD60-A5FED17E541A}';
            automapper.createMap(fromKey, toKey);
            // act
            var arrB = automapper.map(fromKey, toKey, arrA);
            // assert
            expect(arrB).toEqualData(arrA);
        });
    });
})(AutoMapperJs || (AutoMapperJs = {}));
