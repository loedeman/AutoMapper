/// <reference path="../../../tools/typings/jasmine/jasmine.d.ts" />
/// <reference path="../../typings/jasmine-utils.d.ts" />
/// <reference path="../../../src/ts/AutoMapperHelper.ts" />
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
            // clear mappings (please, don't try this at home!)
            for (var key in automapper._mappings) {
                if (!automapper._mappings.hasOwnProperty(key)) {
                    continue;
                }
                delete automapper._mappings[key];
            }
        });
        it('should validate mapping using strictMode set to \'true\' (with valid mappings)', function () {
            // arrange
            automapper.createMap(AssertConfigPropertiesProp, AssertConfigPropertiesProp);
            // act and assert
            automapper.assertConfigurationIsValid(true);
        });
        it('should set strictMode to \'true\' when no value is provided and validate (with valid mappings)', function () {
            // arrange
            automapper.createMap(AssertConfigPropertiesProp, AssertConfigPropertiesProp);
            // act and assert
            automapper.assertConfigurationIsValid();
        });
        // // TODO Should work!
        // it('should set strictMode to \'true\' when no value is provided and validate (with valid mappings)', () => {
        //     // arrange
        //     automapper
        //         .createMap(AssertConfigPropertiesProp, AssertConfigPropertiesProp2)
        //         .forMember('prop2', (opts: AutoMapperJs.IMemberConfigurationOptions) => opts.mapFrom('prop'));
        //     // act and assert
        //     automapper.assertConfigurationIsValid();
        // });
        // it('should set strictMode to \'true\' when no value is provided and validate (with valid nested mappings)', () => {
        //     // arrange
        //     automapper.createMap(AssertConfigPropertiesNestedProp, AssertConfigPropertiesProp)
        //         .forMember('prop', (opts: IMemberConfigurationOptions) => opts.mapFrom('level1.level2'))
        //         .forSourceMember('level1.level2', (opts: ISourceMemberConfigurationOptions) => { opts.ignore(); });
        //     // act and assert
        //     automapper.assertConfigurationIsValid();
        // });
        it('should validate mapping using strictMode set to \'false\'', function () {
            // arrange
            automapper.createMap(AssertConfigPropertiesProp, AssertConfigPropertiesProp);
            automapper.createMap('AssertMappingConfigUntestableA', 'AssertMappingConfigUntestableB');
            // act and assert
            automapper.assertConfigurationIsValid(false);
        });
        it('should fail when validating mappings using strictMode set to \'true\' (with unvalidatable mappings)', function () {
            // arrange
            automapper.createMap(AssertConfigPropertiesProp, AssertConfigPropertiesProp);
            automapper.createMap('AssertMappingConfigUntestableA', 'AssertMappingConfigUntestableB');
            // act
            try {
                automapper.assertConfigurationIsValid(true);
            }
            catch (e) {
                // assert
                var errorMessage = e.message;
                var dekeyedErrorMessage = errorMessage.substr(0, errorMessage.indexOf('\'') + 1) +
                    errorMessage.substr(errorMessage.lastIndexOf('\''));
                expect(dekeyedErrorMessage).toEqual("Mapping '' cannot be validated, since mapping.sourceType or mapping.destinationType are unspecified.");
                return;
            }
            // assert
            expect(null).fail('Expected error was not raised.');
        });
        it('should fail when auto mapping a property which does not exist on destination', function () {
            // arrange
            var srcType = AssertConfigPropertiesProp;
            var dstType = AssertConfigPropertiesProp2;
            var srcName = AutoMapperJs.AutoMapperHelper.getClassName(srcType);
            var dstName = AutoMapperJs.AutoMapperHelper.getClassName(dstType);
            automapper.createMap(srcType, dstType);
            try {
                // act
                automapper.assertConfigurationIsValid(true);
            }
            catch (e) {
                // assert
                expect(e.message).toEqual("Mapping '" + srcName + "=>" + dstName + "' is invalid: Source member 'prop' is configured to be mapped, " +
                    ("but does not exist on destination type (source: '" + srcName + "', destination: '" + dstName + "')."));
                return;
            }
            // assert
            expect(null).fail('Expected error was not raised.');
        });
        it('should succeed when mapping objects with ignored properties not existing on the other side', function () {
            // arrange
            var srcType = AssertConfigPropertiesProp;
            var dstType = AssertConfigPropertiesProp2;
            var srcName = AutoMapperJs.AutoMapperHelper.getClassName(srcType);
            var dstName = AutoMapperJs.AutoMapperHelper.getClassName(dstType);
            automapper
                .createMap(srcType, dstType)
                .forSourceMember('prop', function (opts) { opts.ignore(); })
                .forMember('prop2', function (opts) { opts.ignore(); });
            // act and assert
            automapper.assertConfigurationIsValid(true);
        });
        it('should fail when auto mapping a property which does not exist on source', function () {
            // arrange
            var srcType = AssertConfigPropertiesProp;
            var dstType = AssertConfigPropertiesPropProp2;
            var srcName = AutoMapperJs.AutoMapperHelper.getClassName(srcType);
            var dstName = AutoMapperJs.AutoMapperHelper.getClassName(dstType);
            automapper.createMap(srcType, dstType);
            try {
                // act
                automapper.assertConfigurationIsValid(true);
            }
            catch (e) {
                // assert
                expect(e.message).toEqual("Mapping '" + srcName + "=>" + dstName + "' is invalid: Destination member 'prop2' does not exist on source type (source: '" + srcName + "', destination: '" + dstName + "').");
                return;
            }
            // assert
            expect(null).fail('Expected error was not raised.');
        });
        it('should fail when providing configuration for a property which does not exist on destination', function () {
            // arrange
            var srcType = AssertConfigPropertiesProp;
            var dstType = AssertConfigPropertiesPropProp2;
            var srcName = AutoMapperJs.AutoMapperHelper.getClassName(srcType);
            var dstName = AutoMapperJs.AutoMapperHelper.getClassName(dstType);
            automapper
                .createMap(srcType, dstType)
                .forMember('prop3', function (opts) { opts.ignore(); });
            try {
                // act
                automapper.assertConfigurationIsValid(true);
            }
            catch (e) {
                // assert
                expect(e.message).toEqual("Mapping '" + srcName + "=>" + dstName + "' is invalid: Destination member 'prop3' is configured, but does not exist on destination type (source: '" + srcName + "', destination: '" + dstName + "').");
                return;
            }
            // assert
            expect(null).fail('Expected error was not raised.');
        });
        it('should fail when providing configuration for a property which does not exist on source', function () {
            // arrange
            var srcType = AssertConfigPropertiesProp;
            var dstType = AssertConfigPropertiesPropProp2;
            var srcName = AutoMapperJs.AutoMapperHelper.getClassName(srcType);
            var dstName = AutoMapperJs.AutoMapperHelper.getClassName(dstType);
            automapper
                .createMap(srcType, dstType)
                .forSourceMember('prop2', function (opts) { opts.ignore(); });
            try {
                // act
                automapper.assertConfigurationIsValid(true);
            }
            catch (e) {
                // assert
                expect(e.message).toEqual("Mapping '" + srcName + "=>" + dstName + "' is invalid: Source member 'prop2' is configured, but does not exist on source type (source: '" + srcName + "', destination: '" + dstName + "').");
                return;
            }
            // assert
            expect(null).fail('Expected error was not raised.');
        });
    });
    var AssertConfigPropertiesProp = /** @class */ (function () {
        function AssertConfigPropertiesProp() {
            this.prop = undefined; // TODO Wiki: properties are only available when initialized: http://stackoverflow.com/a/20534039/702357
        }
        return AssertConfigPropertiesProp;
    }());
    var AssertConfigPropertiesProp2 = /** @class */ (function () {
        function AssertConfigPropertiesProp2() {
            this.prop2 = undefined;
        }
        return AssertConfigPropertiesProp2;
    }());
    var AssertConfigPropertiesPropProp2 = /** @class */ (function () {
        function AssertConfigPropertiesPropProp2() {
            this.prop = undefined;
            this.prop2 = undefined;
        }
        return AssertConfigPropertiesPropProp2;
    }());
    var AssertConfigPropertiesNestedProp = /** @class */ (function () {
        function AssertConfigPropertiesNestedProp() {
            this.level1 = {
                level2: undefined
            };
        }
        return AssertConfigPropertiesNestedProp;
    }());
})(AutoMapperJs || (AutoMapperJs = {}));
