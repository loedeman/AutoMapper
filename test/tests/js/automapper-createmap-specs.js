/// <reference path="../../../tools/typings/jasmine/jasmine.d.ts" />
/// <reference path="../../typings/jasmine-utils.d.ts" />
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/// <reference path="../../../dist/automapper-classes.d.ts" />
/// <reference path="../../../dist/automapper-interfaces.d.ts" />
/// <reference path="../../../dist/automapper-declaration.d.ts" />
var globalScope = this;
var AutoMapperJs;
(function (AutoMapperJs) {
    'use strict';
    describe('AutoMapper', function () {
        var postfix = ' [0ef5ef45-4f21-47c4-a86f-48fb852e6897]';
        beforeEach(function () {
            utils.registerTools(globalScope);
            utils.registerCustomMatchers(globalScope);
        });
        it('should have a global automapper object', function () {
            expect(automapper).not.toBeUndefined();
            expect(automapper).not.toBeNull();
            expect(automapper.createMap).not.toBeUndefined();
            expect(automapper.createMap).not.toBeNull();
            expect(typeof automapper.createMap === 'function').toBeTruthy();
            expect(automapper.map).not.toBeUndefined();
            expect(automapper.map).not.toBeNull();
            expect(typeof automapper.map === 'function').toBeTruthy();
        });
        it('should return the Singleton instance when instantiating the Singleton directly', function () {
            // arrange
            var caught = false;
            // act
            var mapper = new AutoMapperJs.AutoMapper();
            expect(automapper).toBe(mapper);
        });
        it('should use created mapping profile', function () {
            // arrange
            var fromKey = '{5700E351-8D88-4327-A216-3CC94A308EDF}';
            var toKey = '{BB33A261-3CA9-48FC-85E6-2C269F73728D}';
            automapper.createMap(fromKey, toKey);
            // act
            automapper.map(fromKey, toKey, {});
            // assert
        });
        it('should fail when using a non-existing mapping profile', function () {
            // arrange
            var caught = false;
            var fromKey = '{5AEFD48C-4472-41E7-BA7E-0977A864E116}';
            var toKey = '{568DCA5E-477E-4739-86B2-38BB237B8EF8}';
            // act
            try {
                automapper.map(fromKey, toKey, {});
            }
            catch (e) {
                caught = true;
                // assert
                expect(e.message).toEqual('Could not find map object with a source of ' + fromKey + ' and a destination of ' + toKey);
            }
            if (!caught) {
                // assert
                expect().fail('Using a non-existing mapping profile should result in an error.');
            }
        });
        it('should be able to use forAllMemberMappings', function () {
            // arrange
            var fromKey = '{5700E351-8D88-4327-A216-3CCBHJ808EDF}';
            var toKey = '{BB33A261-3CA9-48FC-85E6-2C269FDFT28D}';
            var source = { prop1: 'prop1', prop2: 'prop2' };
            var suffix = ' [forAllMembers]';
            automapper.createMap(fromKey, toKey)
                .forMember('prop1', function (opts) { return opts.intermediatePropertyValue; })
                .forMember('prop2', function (opts) { return opts.intermediatePropertyValue; })
                .forAllMembers(function (destinationObject, destinationPropertyName, value) {
                destinationObject[destinationPropertyName] = value + suffix;
            });
            // act
            var destination = automapper.map(fromKey, toKey, source);
            // assert
            expect(destination.prop1).toEqual(source.prop1 + suffix);
            expect(destination.prop2).toEqual(source.prop2 + suffix);
        });
        it('should be able to use forAllMemberMappings when automapping', function () {
            // arrange
            var fromKey = '{5700E351-8D88-4327-A216-3CCBHJ808EDF}';
            var toKey = '{BB33A261-3CA9-48FC-85E6-2C269FDFT28D}';
            var source = { prop1: 'prop1', prop2: 'prop2' };
            var suffix = ' [forAllMembers]';
            automapper.createMap(fromKey, toKey)
                .forAllMembers(function (destinationObject, destinationPropertyName, value) {
                destinationObject[destinationPropertyName] = value + suffix;
            });
            // act
            var destination = automapper.map(fromKey, toKey, source);
            // assert
            expect(destination.prop1).toEqual(source.prop1 + suffix);
            expect(destination.prop2).toEqual(source.prop2 + suffix);
        });
        it('should accept multiple forMember calls for the same destination property and overwrite with the last one specified', function () {
            //arrange
            var objA = { prop1: 'From A', prop2: 'From A too' };
            var fromKey = '{7AC4134B-ECC1-464B-B144-5B9D8F5B568E}';
            var toKey = '{2BDE907C-1CE6-4CC5-A601-9A94CC665837}';
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop1', function (opts) { opts.mapFrom('prop2'); })
                .forMember('prop1', function (opts) { opts.ignore(); });
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB).toEqualData({ prop1: objA.prop1 });
        });
        it('should accept multiple forMember calls for the same destination property and overwrite with the last one specified in any order', function () {
            //arrange
            var objA = { prop1: 'From A', prop2: 'From A too' };
            var fromKey = '{7AC4134B-ECC1-464B-B144-5B9D8F5B568E}';
            var toKey = '{2BDE907C-1CE6-4CC5-A601-9A94CC665837} in any order';
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop1', function (opts) { opts.ignore(); })
                .forMember('prop1', function (opts) { opts.mapFrom('prop2'); });
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB).toEqualData({ prop1: objA.prop1 });
        });
        it('should be able to ignore a source property using the forSourceMember function', function () {
            // arrange
            var objA = { prop1: 'From A', prop2: 'From A too' };
            var fromKey = '{AD88481E-597B-4C1B-967B-3D700B8BAB0F}';
            var toKey = '{2A6714C4-784E-47D3-BBF4-6205834EC8D5}';
            automapper
                .createMap(fromKey, toKey)
                .forSourceMember('prop1', function (opts) { opts.ignore(); });
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB).toEqualData({ prop2: 'From A too' });
        });
        it('should be able to custom map a source property using the forSourceMember function', function () {
            // arrange
            var objA = { prop1: 'From A', prop2: 'From A too' };
            var fromKey = '{AD88481E-597B-4C1B-967B-3D700B8BAB0F}';
            var toKey = '{2A6714C4-784E-47D3-BBF4-6205834EC8D5}';
            automapper
                .createMap(fromKey, toKey)
                .forSourceMember('prop1', function (opts) { return 'Yeah!'; });
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB).toEqualData({ prop1: 'Yeah!', prop2: 'From A too' });
        });
        it('should be able to ignore a source property already specified (by forMember) using the forSourceMember function', function () {
            // arrange
            var objA = { prop1: 'From A', prop2: 'From A too' };
            var fromKey = '{AD88481E-597B-4C1B-967B-3D701B8CAB0A}';
            var toKey = '{2A6714C4-784E-47D3-BBF4-620583DEC86A}';
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop1', 12)
                .forSourceMember('prop1', function (opts) { opts.ignore(); });
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB).toEqualData({ prop2: 'From A too' });
        });
        it('should fail when forSourceMember is used with anything else than a function', function () {
            // arrange
            var caught = false;
            var fromKey = '{5EE20DF9-84B3-4A6A-8C5D-37AEDC44BE87}';
            var toKey = '{986C959D-2E2E-41FA-9857-8EF519467AEB}';
            try {
                // act
                automapper
                    .createMap(fromKey, toKey)
                    .forSourceMember('prop1', 12);
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
        it('should be able to use forMember to map a source property to a destination property with a different name', function () {
            //arrange
            var objA = { prop1: 'From A', prop2: 'From A too' };
            var fromKey = '{7AC4134B-ECC1-464B-B144-5B9D8F5B568E}';
            var toKey = '{2BDE907C-1CE6-4CC5-A601-9A94CC665837}';
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop', function (opts) { opts.mapFrom('prop2'); });
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB).toEqualData({ prop1: objA.prop1, prop: objA.prop2 });
        });
        it('should be able to use forMember to do custom mapping using lambda function', function () {
            //arrange
            var objA = { prop1: 'From A', prop2: 'From A too' };
            var fromKey = '{7AC4134B-ECC1-464B-B144-5B9D8F5B578E}';
            var toKey = '{2BDE907C-1CE6-4CC5-A601-9A94CC665737}';
            var mapFromNullable = function (opts, field) {
                if (opts.sourceObject[field]) {
                    return opts.sourceObject[field];
                }
                return '';
            };
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop', function (opts) { return mapFromNullable(opts, 'prop2'); });
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB).toEqualData({ prop1: objA.prop1, prop: objA.prop2 });
        });
        it('should use forAllMembers function for each mapped destination property when specified', function () {
            // arrange
            var objA = { prop1: 'From A', prop2: 'From A too' };
            var fromKey = '{C4056539-FA86-4398-A10B-C41D3A791F26}';
            var toKey = '{01C64E8D-CDB5-4307-9011-0C7F1E70D115}';
            var forAllMembersSpy = jasmine.createSpy('forAllMembersSpy').and.callFake(function (destinationObject, destinationProperty, value) {
                destinationObject[destinationProperty] = value;
            });
            automapper
                .createMap(fromKey, toKey)
                .forAllMembers(forAllMembersSpy);
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(forAllMembersSpy).toHaveBeenCalled();
            expect(forAllMembersSpy.calls.count()).toBe(Object.keys(objB).length);
        });
        it('should be able to use forMember with a constant value', function () {
            // arrange
            var objA = { prop: 1 };
            var fromKey = '{54E67626-B877-4824-82E6-01E9F411B78F}';
            var toKey = '{2D7FDB88-97E9-45EF-A111-C9CC9C188227}';
            var constantResult = 2;
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop', constantResult);
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB.prop).toBe(constantResult);
        });
        it('should be able to use forMember with a function returning a constant value', function () {
            // arrange
            var objA = { prop: 1 };
            var fromKey = '{74C12B56-1DD1-4EA0-A640-D1F814971124}';
            var toKey = '{BBC617B8-26C8-42A0-A204-45CC77073355}';
            var constantResult = 3;
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop', function () {
                return constantResult;
            });
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB.prop).toBe(constantResult);
        });
        it('should be able to use forMember with a function using the source object', function () {
            // arrange
            var objA = { prop: { subProp: { value: 1 } } };
            var fromKey = '{54E67626-B877-4824-82E6-01E9F411B78F}';
            var toKey = '{2D7FDB88-97E9-45EF-A111-C9CC9C188227}';
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop', function (opts) { return opts.sourceObject[opts.sourcePropertyName].subProp.value * 2; });
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB.prop).toBe(objA.prop.subProp.value * 2);
        });
        it('should be able to use forMember to ignore a property', function () {
            // arrange
            var objA = { prop: 1 };
            var fromKey = '{76D26B33-888A-4DF7-ABDA-E5B99E944272}';
            var toKey = '{18192391-85FF-4729-9A08-5954FCFE3954}';
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop', function (opts) { opts.ignore(); });
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB.hasOwnProperty('prop')).not.toBeTruthy();
        });
        it('should be able to use forMember to map a source property to a destination property with a different name', function () {
            // arrange
            var objA = { propDiff: 1 };
            var fromKey = '{A317A36A-AD92-4346-A015-AE06FC862DB4}';
            var toKey = '{03B05E43-3028-44FD-909F-652E2DA5E607}';
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop', function (opts) { opts.mapFrom('propDiff'); });
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB.prop).toEqual(objA.propDiff);
        });
        it('should be able to use stack forMember calls to map a source property to a destination property using multiple mapping steps', function () {
            // arrange
            var birthdayString = '2000-01-01T00:00:00.000Z';
            var objA = { birthdayString: birthdayString };
            var fromKey = '{564F1F57-FD4F-413C-A9D3-4B1C1333A20B}';
            var toKey = '{F9F45923-2D13-4EF1-9685-4883AD1D2F98}';
            automapper
                .createMap(fromKey, toKey)
                .forMember('birthday', function (opts) { opts.mapFrom('birthdayString'); })
                .forMember('birthday', function (opts) { return new Date(opts.intermediatePropertyValue); });
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB.birthday instanceof Date).toBeTruthy();
            expect(objB.birthday.toISOString()).toEqual('2000-01-01T00:00:00.000Z');
        });
        it('should be able to use stack forMember calls to map a source property to a destination property using multiple mapping steps in any order', function () {
            // arrange
            var birthdayString = '2000-01-01T00:00:00.000Z';
            var objA = { birthdayString: birthdayString };
            var fromKey = '{1609A9B5-6083-448B-8FD6-51DAD106B63D}';
            var toKey = '{47AF7D2D-A848-4C5B-904F-39402E2DCDD5}';
            automapper
                .createMap(fromKey, toKey)
                .forMember('birthday', function (opts) { return new Date(opts.intermediatePropertyValue); })
                .forMember('birthday', function (opts) { opts.mapFrom('birthdayString'); });
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB.birthday instanceof Date).toBeTruthy();
            expect(objB.birthday.toISOString()).toEqual('2000-01-01T00:00:00.000Z');
        });
        it('should not map properties that are not an object\'s own properties', function () {
            var objA = new ClassA();
            objA.propA = 'propA';
            var fromKey = '{A317A36A-AD92-4346-A015-AE06FC862DB4}';
            var toKey = '{03B05E43-3028-44FD-909F-652E2DA5E607}';
            automapper
                .createMap(fromKey, toKey);
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB.propA).toEqual(objA.propA);
        });
        it('should be able to use convertUsing to map an object with a custom type resolver function', function () {
            var objA = { propA: 'propA' };
            var fromKey = '{D1534A0F-6120-475E-B7E2-BF2489C58571}';
            var toKey = '{1896FF99-1A28-4FE6-800B-072D5616B02D}';
            automapper
                .createMap(fromKey, toKey)
                .convertUsing(function (resolutionContext) {
                return { propA: resolutionContext.sourceValue.propA + ' (custom mapped with resolution context)' };
            });
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB.propA).toEqual(objA.propA + ' (custom mapped with resolution context)');
        });
        it('should be able to use convertUsing to map an object with a custom type resolver class', function () {
            // arrange
            var objA = { propA: 'propA' };
            var fromKey = '{6E7F5757-1E55-4B55-BB86-44FF5B33DE2F}';
            var toKey = '{8521AE41-C3AF-4FCD-B7C7-A915C037D69E}';
            automapper
                .createMap(fromKey, toKey)
                .convertUsing(CustomTypeConverterDefinition);
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB.propA).toEqual(objA.propA + ' (convertUsing with a class definition)');
        });
        it('should be able to use convertUsing to map an object with a custom type resolver instance', function () {
            // arrange
            // NOTE BL The CustomTypeConverter class definition is defined at the bottom, since TypeScript
            //         does not allow classes to be defined inline.
            var objA = { propA: 'propA' };
            var fromKey = '{BDF3758C-B38E-4343-95B6-AE0F80C8B9C4}';
            var toKey = '{13DD7AE1-4177-4A80-933B-B60A55859E50}';
            automapper
                .createMap(fromKey, toKey)
                .convertUsing(new CustomTypeConverterInstance());
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB.propA).toEqual(objA.propA + ' (convertUsing with a class instance)');
        });
        it('should fail when directly using the type converter base class', function () {
            // arrange
            var caught = false;
            var objA = { propA: 'propA' };
            var fromKey = 'should fail when directly using ';
            var toKey = 'the type converter base class';
            automapper
                .createMap(fromKey, toKey)
                .convertUsing(AutoMapperJs.TypeConverter);
            try {
                // act
                var objB = automapper.map(fromKey, toKey, objA);
            }
            catch (e) {
                // assert
                caught = true;
                expect(e.message).toEqual('The TypeConverter.convert method is abstract. Use a TypeConverter extension class instead.');
            }
            if (!caught) {
                // assert
                expect().fail('Using the type converter base class directly should fail.');
            }
        });
        it('should fail when convertUsing is used with a function not having exactly one (resolutionContext) parameter.', function () {
            // arrange
            var caught = false;
            var fromKey = '{1EF9AC11-BAA1-48DB-9C96-9DFC40E33BCA}';
            var toKey = '{C4DA81D3-9072-4140-BFA7-431C35C01F54}';
            try {
                // act
                automapper
                    .createMap(fromKey, toKey)
                    .convertUsing(function () {
                    return {};
                });
                //var objB = automapper.map(fromKey, toKey, objA);
            }
            catch (e) {
                // assert
                caught = true;
                expect(e.message).toEqual('The value provided for typeConverterClassOrFunction is invalid. ' +
                    'Error: The function provided does not provide exactly one (resolutionContext) parameter.');
            }
            if (!caught) {
                // assert
                expect().fail('Using anything else than a function with forSourceMember should result in an error.');
            }
        });
        it('should be able to use convertToType to map a source object to a destination object which is an instance of a given class', function () {
            //arrange
            var objA = { ApiProperty: 'From A' };
            var fromKey = '{7AC4134B-ECC1-464B-B144-5C9D8F5B5A7E}';
            var toKey = '{2BDE907C-1CE6-4CC5-A601-9A94CA6C4737}';
            automapper
                .createMap(fromKey, toKey)
                .forMember('property', function (opts) { opts.mapFrom('ApiProperty'); })
                .convertToType(DemoToBusinessType);
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB instanceof DemoToBusinessType).toBeTruthy();
            expect(objB.property).toEqual(objA.ApiProperty);
        });
        it('should be able to use convertToType to map a source object to a destination object with default values defined', function () {
            //arrange
            var objA = { propA: 'another value' };
            var fromKey = '{7AC4134B-ECC1-464B-B144-5C9D8F5B5A7E}';
            var toKey = '{2BDE907C-1CE6-4CC5-A601-9A94CA6C4737}';
            automapper
                .createMap(fromKey, toKey)
                .convertToType(ClassWithDefaultValues);
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB instanceof ClassWithDefaultValues).toBeTruthy();
            expect(objB.propA).toEqual(objA.propA);
        });
        it('should be able to use a condition to map or ignore a property', function () {
            // arrange
            var objA = { prop: 1, prop2: 2 };
            var fromKey = '{76D23B33-888A-4DF7-BEBE-E5B99E944272}';
            var toKey = '{18192191-85FE-4729-A980-5954FCFE3954}';
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop', function (opts) { opts.condition(function (sourceObject) { return sourceObject.prop === 0; }); })
                .forMember('prop2', function (opts) { opts.condition(function (sourceObject) { return sourceObject.prop2 === 2; }); });
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB.hasOwnProperty('prop')).not.toBeTruthy();
            expect(objB.hasOwnProperty('prop2')).toBeTruthy();
        });
        it('should be able to ignore all unmapped members using the ignoreAllNonExisting function', function () {
            // arrange
            var objA = {
                propA: 'Prop A',
                propB: 'Prop B',
                propC: 'Prop C',
                propD: 'Prop D'
            };
            var fromKey = '{AD88481E-597B-4C1C-9A7B-3D70DB8BCB0F}';
            var toKey = '{2A6614C4-784E-47D3-BBF4-6205834EA8D1}';
            automapper
                .createMap(fromKey, toKey)
                .forMember('propA', function (opts) { return opts.mapFrom('propA'); })
                .ignoreAllNonExisting();
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB).toEqualData({ propA: 'Prop A' });
        });
        it('should be able to create a map and use it using class types', function () {
            // arrange
            var objA = new ClassA();
            objA.propA = 'Value';
            // act 
            automapper.createMap(ClassA, ClassB);
            var objB = automapper.map(ClassA, ClassB, objA);
            // assert
            expect(objB instanceof ClassB).toBeTruthy();
            expect(objB).toEqualData({ propA: 'Value' });
        });
        it('should throw an error when creating a map using class types and specifying a conflicting destination type', function () {
            // arrange
            var caught = false;
            // act
            try {
                automapper
                    .createMap(ClassA, ClassB)
                    .convertToType(ClassC);
            }
            catch (e) {
                caught = true;
                // assert
                expect(e.message).toEqual('Destination type class can only be set once.');
            }
            if (!caught) {
                // assert
                expect(null).fail('AutoMapper should throw an error when creating a map using class types and specifying a conflicting destination type.');
            }
        });
        it('should be able to use forMember to map a nested source property to a destination property', function () {
            //arrange
            var objA = { prop1: { propProp1: 'From A' }, prop2: 'From A too' };
            var fromKey = '{7AC4134B-ECC1-464B-B144-5B9D8F5B568E}';
            var toKey = '{2BDE907C-1CE6-4CC5-A601-9A94CC665837}';
            automapper
                .createMap(fromKey, toKey)
                .forMember('propFromNestedSource', function (opts) { opts.mapFrom('prop1.propProp1'); });
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB).toEqualData({ prop2: objA.prop2, propFromNestedSource: objA.prop1.propProp1 });
        });
        it('should be able to stack forMember calls when mapping a nested source property to a destination property', function () {
            //arrange
            var objA = { prop1: { propProp1: 'From A' }, prop2: 'From A too' };
            var addition = ' - sure works!';
            var fromKey = '{7AC4134B-ECC1-464B-B144-5B99CF5B558E}';
            var toKey = '{2BDE907C-1CE6-4CC5-56A1-9A94CC6658C7}';
            automapper
                .createMap(fromKey, toKey)
                .forMember('propFromNestedSource', function (opts) { opts.mapFrom('prop1.propProp1'); })
                .forMember('propFromNestedSource', function (opts) { return opts.intermediatePropertyValue + addition; });
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB).toEqualData({ prop2: objA.prop2, propFromNestedSource: objA.prop1.propProp1 + addition });
        });
        it('should be able to stack forMember calls when mapping a nested source property to a destination property in any order', function () {
            //arrange
            var objA = { prop1: { propProp1: 'From A' }, prop2: 'From A too' };
            var addition = ' - sure works!';
            var fromKey = '{7AC4134B-ECD1-46EB-B14A-5B9D8F5B5F8E}';
            var toKey = '{BBD6907C-ACE6-4FC8-A60D-1A943C66D83F}';
            automapper
                .createMap(fromKey, toKey)
                .forMember('propFromNestedSource', function (opts) { return opts.intermediatePropertyValue + addition; })
                .forMember('propFromNestedSource', function (opts) { opts.mapFrom('prop1.propProp1'); });
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB).toEqualData({ prop2: objA.prop2, propFromNestedSource: objA.prop1.propProp1 + addition });
        });
        it('should be able to stack forMember mapFrom calls when mapping a nested source property to a destination property', function () {
            //arrange
            var objA = { prop1: { propProp1: 'From A', propProp2: { propProp2Prop: 'From A' } }, prop2: 'From A too' };
            var addition = ' - sure works!';
            var fromKey = '{7AC4134B-ECD1-46EB-B14A-5B9D8F5B5F8E}';
            var toKey = '{BBD6907C-ACE6-4FC8-A60D-1A943C66D83F}';
            automapper
                .createMap(fromKey, toKey)
                .forMember('propFromNestedSource', function (opts) { return opts.intermediatePropertyValue + addition; })
                .forMember('propFromNestedSource', function (opts) { opts.mapFrom('prop1.propProp2.propProp2Prop'); })
                .forMember('propFromNestedSource', function (opts) { opts.mapFrom('prop1.propProp1'); });
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB).toEqualData({ prop2: objA.prop2, propFromNestedSource: objA.prop1.propProp1 + addition });
        });
        it('should be able to use forMember to map to a nested destination', function () {
            //arrange
            var objA = {
                prop1: { propProp1: 'From A', propProp2: { propProp2Prop: 'From A' } },
                prop2: 'From A too'
            };
            var addition = ' - sure works!';
            var fromKey = '{7AC4134B-ECD1-46EB-B14A-5B9D8F5B5F8E}';
            var toKey = '{BBD6907C-ACE6-4FC8-A60D-1A943C66D83F}';
            automapper
                .createMap(fromKey, toKey)
                .forMember('nested.property', function (opts) { return opts.intermediatePropertyValue + addition; })
                .forMember('nested.property', function (opts) { opts.mapFrom('prop1.propProp2.propProp2Prop'); })
                .forMember('nested.property', function (opts) { opts.mapFrom('prop1.propProp1'); });
            // act
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB).toEqualData({ prop2: objA.prop2, nested: { property: objA.prop1.propProp1 + addition } });
        });
        it('should be able to use mapFrom to switch properties and ignore a property as well', function () {
            // arrange
            var objA = { prop1: 'From A', prop2: 'From A too', prop3: 'Also from A (really)' };
            var fromKey = 'should be able to use mapFrom to switch ';
            var toKey = 'properties and ignore a property as well';
            // act
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop1', function (opts) { opts.mapFrom('prop2'); })
                .forMember('prop2', function (opts) { opts.mapFrom('prop1'); })
                .forSourceMember('prop3', function (opts) { opts.ignore(); });
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB).toEqualData({ prop1: objA.prop2, prop2: objA.prop1 });
        });
        it('should be able to create a new property using a constant value', function () {
            // arrange
            var objA = {};
            var fromKey = 'should be able to create a new property ';
            var toKey = 'using a constant value';
            // act
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop4', function (opts) { return 12; });
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB).toEqualData({ prop4: 12 });
        });
        it('should just return source object when no properties are created using null source object', function () {
            // arrange
            var objA = null;
            var fromKey = 'should just return source object when no ';
            var toKey = 'properties created using null source object';
            // act
            automapper
                .createMap(fromKey, toKey);
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB).toBeNull();
        });
        it('should be able to create a new property using a constant value (empty source object)', function () {
            // arrange
            var objA = {};
            var fromKey = 'should be able to create a new property ';
            var toKey = 'using a constant value (empty source object)';
            // act
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop4', function (opts) { return 12; });
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB).toEqualData({ prop4: 12 });
        });
        it('should map a source object with empty nested objects', function () {
            // arrange
            var src = {
                // homeAddress: undefined,
                // homeAddress: null,
                businessAddress: {
                    address1: '200 Main St',
                    // address2: '200 Main St', 
                    city: 'Los Angeles',
                    state: 'CA',
                    zip: '90000'
                }
            };
            var fromKey = '{60E9DC56-D6E1-48FF-9BAC-0805FCAF91B7}';
            var toKey = '{AC6D5A97-9AEF-42C7-BD60-A5F3D17E541A}';
            automapper
                .createMap(fromKey, toKey)
                .forMember('homeAddress.address2', function (opts) { opts.mapFrom('homeAddress.address2'); })
                .forMember('businessAddress.address1', function (opts) { opts.mapFrom('businessAddress.address1'); })
                .forMember('businessAddress.address2', function (opts) { return null; })
                .forMember('businessAddress.city', function (opts) { opts.mapFrom('businessAddress.city'); })
                .forMember('businessAddress.state', function (opts) { opts.mapFrom('businessAddress.state'); })
                .forMember('businessAddress.zip', function (opts) { opts.mapFrom('businessAddress.zip'); });
            // act
            var dst = automapper.map(fromKey, toKey, src);
            // assert
            expect(dst).not.toBeNull();
            expect(dst.homeAddress).toBeUndefined();
            expect(dst.businessAddress.address1).toBe(src.businessAddress.address1);
            expect(dst.businessAddress.address2).toBeNull();
            expect(dst.businessAddress.city).toBe(src.businessAddress.city);
            expect(dst.businessAddress.state).toBe(src.businessAddress.state);
            expect(dst.businessAddress.zip).toBe(src.businessAddress.zip);
        });
        it('should be able to use mapFrom to map from property which is ignored itself on destination', function () {
            // arrange
            var objA = { prop1: 'From A', prop2: 'From A too', prop3: 'Also from A (really)' };
            var fromKey = 'should be able to use mapFrom to map from ';
            var toKey = 'property which is ignored itself on destination';
            // act
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop1', function (opts) { opts.mapFrom('prop2'); })
                .forMember('prop2', function (opts) { opts.ignore(); }) // changing 'prop2' to e.g. 'destProp2' everything works correctly.
                .forSourceMember('prop3', function (opts) { opts.ignore(); })
                .forMember('prop4', function () { return 12; });
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB).toEqualData({ prop1: objA.prop2, prop4: 12 });
        });
        it('should be able to use forMember and use opts.sourceObject', function () {
            // arrange
            var objA = { prop1: 'prop1', prop2: 'prop2' };
            var fromKey = 'should be able to use forMember ';
            var toKey = 'and access opts.sourceObject' + postfix;
            // act
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop1', function (opts) { return opts.sourceObject; })
                .forMember('prop2', function (opts) { return opts.sourceObject['prop1']; });
            // assert
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB).toEqualData({ prop1: objA, prop2: objA.prop1 });
        });
        it('should be able to use forMember and use opts.intermediatePropertyValue', function () {
            // arrange
            var objA = { prop1: 1 };
            var fromKey = 'should be able to use forMember ';
            var toKey = 'and access opts.intermediatePropertyValue' + postfix;
            // act
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop', function (opts) { return opts.mapFrom('prop1'); })
                .forMember('prop', function (opts) { return !!opts.intermediatePropertyValue; });
            // assert
            var objB = automapper.map(fromKey, toKey, objA);
            // assert
            expect(objB).toEqualData({ prop: true });
        });
        //     // TODO expand AutoMapperBase.handleItem to also handle nested properties (not particularly hard to do anymore, but still requires quite a bit of work)
        //     it('should map a source object with nested objects using mapping functions and automapping at the same time', () => {
        //         // arrange
        //         var src: any = {
        //             businessAddress: {
        //                 address1: '200 Main St', 
        //                 city: 'Los Angeles',
        //                 state: 'CA',
        //                 zip: '90000'
        //             }
        //         };
        //         var fromKey = '{60E9DC56-D6E1-48FF-9BAC-0805FCAF91B7}';
        //         var toKey = '{AC6D5A97-9AEF-42C7-BD60-A5F3D17E541A}';
        //         automapper
        //             .createMap(fromKey, toKey)
        //             .forMember('businessAddress.address2', (opts: IMemberConfigurationOptions) => <any>null); 
        //         // the forMember call currently fails the test. Automapping on nested properties is currently 
        //         // not implemented when a forMember call is present! Should work somewhat like the handleItem
        //         // function at 'root level'.
        //         // act
        //         var dst = automapper.map(fromKey, toKey, src);
        //         // assert
        //         expect(dst).not.toBeNull();
        //         expect(dst.homeAddress).toBeUndefined();
        //         console.log(dst);
        //         expect(dst.businessAddress.address1).toBe(src.businessAddress.address1);
        //         expect(dst.businessAddress.address2).toBeUndefined();
        //         expect(dst.businessAddress.city).toBe(src.businessAddress.city);
        //         expect(dst.businessAddress.state).toBe(src.businessAddress.state);
        //         expect(dst.businessAddress.zip).toBe(src.businessAddress.zip);
        //     });
    });
    var ClassA = /** @class */ (function () {
        function ClassA() {
            this.propA = null;
        }
        return ClassA;
    }());
    var ClassB = /** @class */ (function () {
        function ClassB() {
            this.propA = null;
        }
        return ClassB;
    }());
    //Initialization of property necessary to force Javascript create this property on class
    var ClassC = /** @class */ (function () {
        function ClassC() {
            this.propA = null;
        }
        return ClassC;
    }());
    var ClassWithDefaultValues = /** @class */ (function () {
        function ClassWithDefaultValues() {
            this.propA = 'default value';
        }
        return ClassWithDefaultValues;
    }());
    var DemoToBusinessType = /** @class */ (function () {
        function DemoToBusinessType() {
        }
        return DemoToBusinessType;
    }());
    var CustomTypeConverterInstance = /** @class */ (function (_super) {
        __extends(CustomTypeConverterInstance, _super);
        function CustomTypeConverterInstance() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        CustomTypeConverterInstance.prototype.convert = function (resolutionContext) {
            return { propA: resolutionContext.sourceValue.propA + ' (convertUsing with a class instance)' };
        };
        return CustomTypeConverterInstance;
    }(AutoMapperJs.TypeConverter));
    var CustomTypeConverterDefinition = /** @class */ (function (_super) {
        __extends(CustomTypeConverterDefinition, _super);
        function CustomTypeConverterDefinition() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        CustomTypeConverterDefinition.prototype.convert = function (resolutionContext) {
            return { propA: resolutionContext.sourceValue.propA + ' (convertUsing with a class definition)' };
        };
        return CustomTypeConverterDefinition;
    }(AutoMapperJs.TypeConverter));
})(AutoMapperJs || (AutoMapperJs = {}));
