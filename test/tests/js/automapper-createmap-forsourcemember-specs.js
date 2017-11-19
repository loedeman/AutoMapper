/// <reference path="../../../tools/typings/jasmine/jasmine.d.ts" />
/// <reference path="../../typings/jasmine-utils.d.ts" />
/// <reference path="../../../dist/automapper-classes.d.ts" />
/// <reference path="../../../dist/automapper-interfaces.d.ts" />
/// <reference path="../../../dist/automapper-declaration.d.ts" />
var globalScope = this;
var AutoMapperJs;
(function (AutoMapperJs) {
    'use strict';
    describe('AutoMapper.createMap.forSourceMember', function () {
        var postfix = ' [5fbe5d7c-9348-4c0b-a2d8-21f7d16fd7d4]';
        beforeEach(function () {
            utils.registerTools(globalScope);
            utils.registerCustomMatchers(globalScope);
        });
        it('should be able to use forSourceMember to ignore a property', function () {
            // arrange
            var fromKey = 'should be able to use ';
            var toKey = 'forSourceMember to ignore a property' + postfix;
            var ignoreFunc = function (opts) { return opts.ignore(); };
            // act
            automapper
                .createMap(fromKey, toKey)
                .forSourceMember('prop', ignoreFunc);
            // assert
            var properties = TestHelper.assertAndGetProperty(fromKey, toKey);
            expect(properties.length).toBe(1);
            expect(properties[0]).toEqualData({
                name: 'prop',
                destinationPropertyName: 'prop',
                parent: null,
                level: 0,
                children: [],
                destination: { name: 'prop', parent: null, level: 0, child: null, transformations: [{ transformationType: AutoMapperJs.DestinationTransformationType.SourceMemberOptions, sourceMemberConfigurationOptionsFunc: ignoreFunc }], sourceMapping: true, ignore: true }
            });
        });
        it('should be able to custom map a source property using the forSourceMember function', function () {
            // arrange
            var fromKey = 'should be able to custom map a source ';
            var toKey = 'property using the forSourceMember function' + postfix;
            var customMappingFunc = function (opts) { return 'Yeah!'; };
            // act
            automapper
                .createMap(fromKey, toKey)
                .forSourceMember('prop', customMappingFunc);
            // assert
            var properties = TestHelper.assertAndGetProperty(fromKey, toKey);
            expect(properties.length).toBe(1);
            expect(properties[0]).toEqualData({
                name: 'prop',
                destinationPropertyName: 'prop',
                parent: null,
                level: 0,
                children: [],
                destination: { name: 'prop', parent: null, level: 0, child: null, transformations: [{ transformationType: AutoMapperJs.DestinationTransformationType.SourceMemberOptions, sourceMemberConfigurationOptionsFunc: customMappingFunc }], sourceMapping: true, ignore: false }
            });
        });
        it('should be able to ignore a source property already specified (by forMember) using the forSourceMember function', function () {
            // arrange
            var fromKey = 'should be able to ignore a source property already specified ';
            var toKey = '(by forMember) using the forSourceMember function' + postfix;
            var mapFromFunc = function (opts) { return opts.mapFrom('prop2'); };
            var ignoreFunc = function (opts) { return opts.ignore(); };
            // act
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop1', mapFromFunc)
                .forSourceMember('prop2', ignoreFunc);
            // assert
            var properties = TestHelper.assertAndGetProperty(fromKey, toKey);
            expect(properties.length).toBe(1);
            expect(properties[0]).toEqualData({
                name: 'prop2',
                destinationPropertyName: 'prop1',
                parent: null,
                level: 0,
                children: [],
                destination: {
                    name: 'prop1',
                    parent: null,
                    level: 0,
                    child: null,
                    transformations: [
                        { transformationType: AutoMapperJs.DestinationTransformationType.MemberOptions, memberConfigurationOptionsFunc: mapFromFunc },
                        { transformationType: AutoMapperJs.DestinationTransformationType.SourceMemberOptions, sourceMemberConfigurationOptionsFunc: ignoreFunc }
                    ],
                    ignore: true,
                    sourceMapping: true
                }
            });
        });
        it('should be able to use forSourceMember to ignore a property and use forMember.mapFrom to write to a custom destination at the same time', function () {
            // arrange
            var fromKey = 'should be able to use forSourceMember to ignore a property ';
            var toKey = 'and use forMember.mapFrom to write to a custom destination at the same time' + postfix;
            var mapFromFunc = function (opts) { return opts.mapFrom('prop2'); };
            var ignoreFunc = function (opts) { return opts.ignore(); };
            // act
            automapper
                .createMap(fromKey, toKey)
                .forSourceMember('prop1', ignoreFunc)
                .forMember('prop1', mapFromFunc);
            // assert
            var properties = TestHelper.assertAndGetProperty(fromKey, toKey);
            expect(properties.length).toBe(2);
            expect(properties[0]).toEqualData({
                name: 'prop1',
                destinationPropertyName: 'prop1',
                parent: null,
                level: 0,
                children: [],
                destination: { name: 'prop1', parent: null, level: 0, child: null, transformations: [{ transformationType: AutoMapperJs.DestinationTransformationType.SourceMemberOptions, sourceMemberConfigurationOptionsFunc: ignoreFunc }], ignore: true, sourceMapping: true }
            });
            expect(properties[1]).toEqualData({
                name: 'prop2',
                destinationPropertyName: 'prop1',
                parent: null,
                level: 0,
                children: [],
                destination: { name: 'prop1', parent: null, level: 0, child: null, transformations: [{ transformationType: AutoMapperJs.DestinationTransformationType.MemberOptions, memberConfigurationOptionsFunc: mapFromFunc }], ignore: false, sourceMapping: false }
            });
        });
        it('should fail when forSourceMember is used with anything else than a function', function () {
            // arrange
            var caught = false;
            var fromKey = 'should be able to use ';
            var toKey = 'forSourceMember to ignore a property' + postfix;
            var ignoreFunc = function (opts) { return opts.ignore(); };
            try {
                // act
                automapper
                    .createMap(fromKey, toKey)
                    .forSourceMember('prop', 12);
            }
            catch (e) {
                // assert
                caught = true;
                expect(e.message).toEqual('Configuration of forSourceMember has to be a function with one (sync) or two (async) options parameters.');
            }
            if (!caught) {
                // assert
                expect().fail('Using anything else than a function with forSourceMember should result in an error.');
            }
        });
    });
    var TestHelper = /** @class */ (function () {
        function TestHelper() {
        }
        TestHelper.assertAndGetMapping = function (fromKey, toKey) {
            var mapping = automapper._mappings[fromKey + toKey]; // test only => unsupported in production!
            expect(mapping).not.toBeNull();
            return mapping;
        };
        TestHelper.assertAndGetProperty = function (fromKey, toKey) {
            var mapping = TestHelper.assertAndGetMapping(fromKey, toKey);
            return mapping.properties;
        };
        return TestHelper;
    }());
})(AutoMapperJs || (AutoMapperJs = {}));
