/// <reference path="../../../tools/typings/jasmine/jasmine.d.ts" />
/// <reference path="../../typings/jasmine-utils.d.ts" />
/// <reference path="../../../dist/automapper-classes.d.ts" />
/// <reference path="../../../dist/automapper-interfaces.d.ts" />
/// <reference path="../../../dist/automapper-declaration.d.ts" />
var globalScope = this;
var AutoMapperJs;
(function (AutoMapperJs) {
    'use strict';
    describe('AutoMapper.createMap.forMember', function () {
        var postfix = ' [f0e5ef36-e1ed-47c4-a86f-48f8b52e6897]';
        beforeEach(function () {
            utils.registerTools(globalScope);
            utils.registerCustomMatchers(globalScope);
        });
        it('should be able to use forMember to ignore a property', function () {
            // arrange
            var fromKey = 'should be able to use ';
            var toKey = 'forMember to ignore a property' + postfix;
            var ignoreFunc = function (opts) { return opts.ignore(); };
            // act
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop', ignoreFunc);
            // assert
            var properties = TestHelper.assertAndGetProperty(fromKey, toKey);
            expect(properties.length).toBe(1);
            expect(properties[0]).toEqualData({
                name: 'prop',
                destinationPropertyName: 'prop',
                parent: null,
                level: 0,
                children: [],
                destination: { name: 'prop', parent: null, level: 0, child: null, transformations: [{ transformationType: 2, memberConfigurationOptionsFunc: ignoreFunc }], sourceMapping: false, ignore: true }
            });
        });
        it('should be able to create a new property using a constant value', function () {
            // arrange
            var fromKey = 'should be able to create a new property ';
            var toKey = 'using a constant value' + postfix;
            var func = function (opts) { return 12; };
            // act
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop', func);
            // assert
            var properties = TestHelper.assertAndGetProperty(fromKey, toKey);
            expect(properties.length).toBe(1);
            expect(properties[0]).toEqualData({
                name: 'prop',
                destinationPropertyName: 'prop',
                parent: null,
                level: 0,
                children: [],
                destination: { name: 'prop', parent: null, level: 0, child: null, transformations: [{ transformationType: 2, memberConfigurationOptionsFunc: func }], ignore: false }
            });
        });
        it('should be able to use forMember to mapFrom and ignore a property', function () {
            // arrange
            var fromKey = 'should be able to use ';
            var toKey = 'forMember to mapFrom and ignore a property' + postfix;
            var mapFromFunc = function (opts) { return opts.mapFrom('prop2'); };
            var ignoreFunc = function (opts) { return opts.ignore(); };
            // act
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop1', mapFromFunc)
                .forMember('prop2', ignoreFunc);
            // assert
            var properties = TestHelper.assertAndGetProperty(fromKey, toKey);
            expect(properties.length).toBe(2);
            expect(properties[0]).toEqualData({
                name: 'prop2',
                destinationPropertyName: 'prop1',
                parent: null,
                level: 0,
                children: [],
                destination: { name: 'prop1', parent: null, level: 0, child: null, transformations: [{ transformationType: 2, memberConfigurationOptionsFunc: mapFromFunc }], ignore: false, sourceMapping: false }
            });
            expect(properties[1]).toEqualData({
                name: 'prop2',
                destinationPropertyName: 'prop2',
                parent: null,
                level: 0,
                children: [],
                destination: { name: 'prop2', parent: null, level: 0, child: null, transformations: [{ transformationType: 2, memberConfigurationOptionsFunc: ignoreFunc }], ignore: true, sourceMapping: false }
            });
        });
        it('should accept multiple forMember calls for the same destination property and overwrite with the last one specified', function () {
            // arrange
            var fromKey = 'should accept multiple forMember calls for ';
            var toKey = 'the same destination property and overwrite with the last one specified' + postfix;
            var mapFromFunc = function (opts) { return opts.mapFrom('prop2'); };
            var ignoreFunc = function (opts) { return opts.ignore(); };
            // act
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop1', mapFromFunc)
                .forMember('prop1', ignoreFunc);
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
                        { transformationType: 2, memberConfigurationOptionsFunc: mapFromFunc },
                        { transformationType: 2, memberConfigurationOptionsFunc: ignoreFunc }
                    ],
                    ignore: true,
                    sourceMapping: false
                }
            });
        });
        it('should be able to use forMember with a constant value', function () {
            // arrange
            var fromKey = 'should be able to use forMember ';
            var toKey = 'with a constant value' + postfix;
            var constantResult = 2;
            // act
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop', constantResult);
            // assert
            var properties = TestHelper.assertAndGetProperty(fromKey, toKey);
            expect(properties.length).toBe(1);
            expect(properties[0]).toEqualData({
                name: 'prop',
                destinationPropertyName: 'prop',
                parent: null,
                level: 0,
                children: [],
                destination: {
                    name: 'prop',
                    parent: null,
                    level: 0,
                    child: null,
                    transformations: [
                        { transformationType: 1, constant: constantResult }
                    ],
                    ignore: false,
                    sourceMapping: false
                }
            });
        });
        it('should be able to use stack forMember calls to map a source property to a destination property using multiple mapping steps', function () {
            // arrange
            var fromKey = 'should be able to use stack forMember calls to map a ';
            var toKey = 'source property to a destination property using multiple mapping steps' + postfix;
            var mapFromFunc = function (opts) { return opts.mapFrom('birthdayString'); };
            var makeDateFunc = function (opts) { return new Date(opts.intermediatePropertyValue); };
            // act
            automapper
                .createMap(fromKey, toKey)
                .forMember('birthday', mapFromFunc)
                .forMember('birthday', makeDateFunc);
            // assert
            var properties = TestHelper.assertAndGetProperty(fromKey, toKey);
            expect(properties.length).toBe(1);
            expect(properties[0]).toEqualData({
                name: 'birthdayString',
                destinationPropertyName: 'birthday',
                parent: null,
                level: 0,
                children: [],
                destination: {
                    name: 'birthday',
                    parent: null,
                    level: 0,
                    child: null,
                    transformations: [
                        { transformationType: 2, memberConfigurationOptionsFunc: mapFromFunc },
                        { transformationType: 2, memberConfigurationOptionsFunc: makeDateFunc }
                    ],
                    ignore: false,
                    sourceMapping: false
                }
            });
        });
        it('should be able to stack forMember calls and still ignore', function () {
            // arrange
            var fromKey = 'should be able to stack forMember ';
            var toKey = 'calls and still ignore' + postfix;
            var mapFromFunc = function (opts) { return opts.mapFrom('birthdayString'); };
            var makeDateFunc = function (opts) { return new Date(opts.intermediatePropertyValue); };
            var ignoreFunc = function (opts) { return opts.ignore(); };
            // act
            automapper
                .createMap(fromKey, toKey)
                .forMember('birthday', mapFromFunc)
                .forMember('birthday', makeDateFunc)
                .forMember('birthday', ignoreFunc);
            // assert
            var properties = TestHelper.assertAndGetProperty(fromKey, toKey);
            expect(properties.length).toBe(1);
            expect(properties[0]).toEqualData({
                name: 'birthdayString',
                destinationPropertyName: 'birthday',
                parent: null,
                level: 0,
                children: [],
                destination: {
                    name: 'birthday',
                    parent: null,
                    level: 0,
                    child: null,
                    transformations: [
                        { transformationType: 2, memberConfigurationOptionsFunc: mapFromFunc },
                        { transformationType: 2, memberConfigurationOptionsFunc: makeDateFunc },
                        { transformationType: 2, memberConfigurationOptionsFunc: ignoreFunc }
                    ],
                    ignore: true,
                    sourceMapping: false
                }
            });
        });
        it('should be able to use forMember to map a nested source property to a flat destination property', function () {
            // arrange
            var fromKey = 'should be able to use forMember to map a nested source ';
            var toKey = 'property to a flat destination property' + postfix;
            var mapFromFunc = function (opts) { return opts.mapFrom('srcLevel1.srcLevel2'); };
            var ignoreFunc = function (opts) { return opts.ignore(); };
            // act
            automapper
                .createMap(fromKey, toKey)
                .forMember('dstLevel1', mapFromFunc);
            // assert
            var properties = TestHelper.assertAndGetProperty(fromKey, toKey);
            expect(properties.length).toBe(1);
            var srcLevel1 = {
                name: 'srcLevel1',
                destinationPropertyName: 'dstLevel1',
                parent: null,
                level: 0,
                children: []
            };
            var srcLevel2 = {
                name: 'srcLevel2',
                destinationPropertyName: 'dstLevel1',
                parent: srcLevel1,
                level: 1,
                children: [],
                destination: {
                    name: 'dstLevel1',
                    sourcePropertyName: 'srcLevel1.srcLevel2',
                    parent: null,
                    level: 0,
                    child: null,
                    transformations: [{ transformationType: 2, memberConfigurationOptionsFunc: mapFromFunc }],
                    ignore: false,
                    sourceMapping: false
                }
            };
            srcLevel1.children.push(srcLevel2);
            expect(properties[0]).toEqualData(srcLevel1, 10 /* prevent stack overflow exception (parent/child properties) */);
        });
        it('should be able to use forMember to map a nested source property to a nested destination property', function () {
            // arrange
            var fromKey = 'should be able to use forMember to map a nested source ';
            var toKey = 'property to a nested destination property' + postfix;
            var mapFromFunc = function (opts) { return opts.mapFrom('srcLevel1.srcLevel2'); };
            var ignoreFunc = function (opts) { return opts.ignore(); };
            // act
            automapper
                .createMap(fromKey, toKey)
                .forMember('dstLevel1.dstLevel2', mapFromFunc);
            // assert
            var properties = TestHelper.assertAndGetProperty(fromKey, toKey);
            expect(properties.length).toBe(1);
            var dstLevel1 = {
                name: 'dstLevel1',
                sourcePropertyName: 'srcLevel1.srcLevel2',
                parent: null,
                level: 0,
                child: null,
                transformations: [],
                ignore: false,
                sourceMapping: false
            };
            var dstLevel2 = {
                name: 'dstLevel2',
                sourcePropertyName: 'srcLevel1.srcLevel2',
                parent: dstLevel1,
                level: 1,
                child: null,
                transformations: [{ transformationType: 2, memberConfigurationOptionsFunc: mapFromFunc }],
                ignore: false,
                sourceMapping: false
            };
            dstLevel1.child = dstLevel2;
            var srcLevel1 = {
                name: 'srcLevel1',
                destinationPropertyName: 'dstLevel1.dstLevel2',
                parent: null,
                level: 0,
                children: [],
                destination: null
            };
            var srcLevel2 = {
                name: 'srcLevel2',
                destinationPropertyName: 'dstLevel1.dstLevel2',
                parent: srcLevel1,
                level: 1,
                children: [],
                destination: dstLevel1
            };
            srcLevel1.children.push(srcLevel2);
            expect(properties[0]).toEqualData(srcLevel1, 10 /* prevent stack overflow exception (parent/child properties) */);
        });
        // it('should work', () => {
        //     // arrange
        //     // act
        //     // assert
        // });
    });
    var TestHelper = (function () {
        function TestHelper() {
        }
        TestHelper.assertAndGetMapping = function (fromKey, toKey) {
            var mapping = automapper._mappings[fromKey + toKey]; // test only => unsupported in production!
            expect(mapping).not.toBeNull();
            return mapping;
        };
        TestHelper.assertAndGetProperty = function (fromKey, toKey) {
            var mapping = TestHelper.assertAndGetMapping(fromKey, toKey);
            return mapping.propertiesNew;
        };
        return TestHelper;
    }());
})(AutoMapperJs || (AutoMapperJs = {}));
