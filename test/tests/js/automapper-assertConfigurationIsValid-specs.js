/// <reference path="../../../tools/typings/jasmine/jasmine.d.ts" />
/// <reference path="../../typings/jasmine-utils.d.ts" />
/// <reference path="../../../dist/arcady-automapper-classes.d.ts" />
/// <reference path="../../../dist/arcady-automapper-interfaces.d.ts" />
/// <reference path="../../../dist/arcady-automapper-declaration.d.ts" />
var globalScope = this;
var AutoMapperJs;
(function (AutoMapperJs) {
    describe('AutoMapper', function () {
        beforeEach(function () {
            utils.registerTools(globalScope);
            utils.registerCustomMatchers(globalScope);
            // clear mappings (please, don't try this at home!)
            for (var key in automapper.mappings) {
                if (!automapper.mappings.hasOwnProperty(key)) {
                    continue;
                }
                delete automapper.mappings[key];
            }
        });
        it('should validate mapping using strictMode set to \'true\' (with valid mappings)', function () {
            // arrange
            automapper.createMap(AssertConfigClassValidA, AssertConfigClassValidB);
            // act and assert
            automapper.assertConfigurationIsValid(false);
        });
        it('should validate mapping using strictMode set to \'false\'', function () {
            // arrange
            automapper.createMap(AssertConfigClassValidA, AssertConfigClassValidB);
            automapper.createMap('AssertMappingConfigUntestableA', 'AssertMappingConfigUntestableB');
            // act and assert
            automapper.assertConfigurationIsValid(false);
        });
        it('should fail when validating mappings using strictMode set to \'true\' (with unvalidatable mappings)', function () {
            // arrange
            var caught = false;
            automapper.createMap(AssertConfigClassValidA, AssertConfigClassValidB);
            automapper.createMap('AssertMappingConfigUntestableA', 'AssertMappingConfigUntestableB');
            // act
            try {
                automapper.assertConfigurationIsValid(true);
            }
            catch (e) {
                caught = true;
                // assert
                var errorMessage = e.message;
                var dekeyedErrorMessage = errorMessage.substr(0, errorMessage.indexOf('\'') + 1) +
                    errorMessage.substr(errorMessage.lastIndexOf('\''));
                expect(dekeyedErrorMessage).toEqual("Mapping '' cannot be validated, since mapping.sourceType or mapping.destinationType are unspecified.");
            }
            if (!caught) {
                // assert
                expect(null).fail('AutoMapper should throw an error when creating a map using class types and specifying a conflicting destination type.');
            }
        });
    });
    var AssertConfigClassValidA = (function () {
        function AssertConfigClassValidA() {
        }
        return AssertConfigClassValidA;
    })();
    var AssertConfigClassValidB = (function () {
        function AssertConfigClassValidB() {
        }
        return AssertConfigClassValidB;
    })();
})(AutoMapperJs || (AutoMapperJs = {}));
