/// <reference path="../../dist/automapper-interfaces.d.ts" />
/// <reference path="AutoMapperHelper.ts" />
var AutoMapperJs;
(function (AutoMapperJs) {
    'use strict';
    /**
     * AutoMapper configuration validator.
     */
    var AutoMapperValidator = (function () {
        function AutoMapperValidator() {
        }
        /**
         * Validates mapping configuration by dry-running. Since JS does not
         * fully support typing, it only checks if properties match on both
         * sides. The function needs IMapping.sourceTypeClass and
         * IMapping.destinationTypeClass to function.
         * @param {boolean} strictMode Whether or not to fail when properties
         *                             sourceTypeClass or destinationTypeClass
         *                             are unavailable.
         */
        AutoMapperValidator.assertConfigurationIsValid = function (mappings, strictMode) {
            for (var key in mappings) {
                if (!mappings.hasOwnProperty(key)) {
                    continue;
                }
                AutoMapperValidator.assertMappingConfiguration(mappings[key], strictMode);
            }
        };
        AutoMapperValidator.assertMappingConfiguration = function (mapping, strictMode) {
            var mappingKey = mapping.sourceKey + "=>" + mapping.destinationKey;
            var sourceType = mapping.sourceTypeClass;
            var destinationType = mapping.destinationTypeClass;
            var sourceClassName = sourceType ? AutoMapperJs.AutoMapperHelper.getClassName(sourceType) : undefined;
            var destinationClassName = destinationType ? AutoMapperJs.AutoMapperHelper.getClassName(destinationType) : undefined;
            if (!sourceType || !destinationType) {
                if (strictMode === false) {
                    return;
                }
                throw new Error("Mapping '" + mappingKey + "' cannot be validated, since mapping.sourceType or mapping.destinationType are unspecified.");
            }
            var tryHandle = function (errorMessage) {
                if (errorMessage) {
                    throw new Error("Mapping '" + mappingKey + "' is invalid: " + errorMessage + " (source: '" + sourceClassName + "', destination: '" + destinationClassName + "').");
                }
            };
            var validatedMembers = new Array();
            var srcObj = new sourceType();
            var dstObj = new destinationType();
            // walk member mappings
            for (var _i = 0, _a = mapping.properties; _i < _a.length; _i++) {
                var property = _a[_i];
                tryHandle(AutoMapperValidator.validatePropertyMapping(property, property.name, srcObj, dstObj));
                validatedMembers.push(property.name);
            }
            // walk source members
            for (var srcMember in srcObj) {
                if (!srcObj.hasOwnProperty(srcMember)) {
                    continue;
                }
                if (validatedMembers.indexOf(srcMember) >= 0) {
                    // already validated
                    continue;
                }
                tryHandle(AutoMapperValidator.validateProperty(srcMember, dstObj));
                validatedMembers.push(srcMember);
            }
            // walk destination members
            for (var dstMember in dstObj) {
                if (!dstObj.hasOwnProperty(dstMember)) {
                    continue;
                }
                if (validatedMembers.indexOf(dstMember) >= 0) {
                    // already validated
                    continue;
                }
                tryHandle("Destination member '" + dstMember + "' does not exist on source type");
            }
            // /* tslint:disable */
            // console.error(key);
            // /* tslint:enable */            
        };
        AutoMapperValidator.validatePropertyMapping = function (propertyMapping, member, srcObj, dstObj) {
            return propertyMapping.sourceMapping
                ? AutoMapperValidator.validateSourcePropertyMapping(propertyMapping, member, srcObj, dstObj)
                : AutoMapperValidator.validateDestinationPropertyMapping(propertyMapping, member, srcObj, dstObj);
        };
        AutoMapperValidator.validateSourcePropertyMapping = function (propertyMapping, member, srcObj, dstObj) {
            // a member for which configuration is provided, should exist.
            if (!srcObj.hasOwnProperty(member)) {
                return "Source member '" + member + "' is configured, but does not exist on source type";
            }
            // an ignored source member should not exist on the destination type. 
            if (propertyMapping.ignore) {
                if (dstObj.hasOwnProperty(member)) {
                    return "Source member '" + member + "' is ignored, but does exist on destination type";
                }
                return;
            }
            // a mapped source member should exist on the destination type.
            if (!dstObj.hasOwnProperty(member)) {
                return "Source member '" + member + "' is configured to be mapped, but does not exist on destination type";
            }
            //var dstMember = propertyMapping.destinationProperty;
            return undefined;
        };
        AutoMapperValidator.validateDestinationPropertyMapping = function (propertyMapping, member, srcObj, dstObj) {
            // a member for which configuration is provided, should exist.
            if (!dstObj.hasOwnProperty(member)) {
                return "Destination member '" + member + "' is configured, but does not exist on destination type";
            }
            // an ignored destination member should not exist on the source type. 
            if (propertyMapping.ignore) {
                if (srcObj.hasOwnProperty(member)) {
                    return "Destination member '" + member + "' is ignored, but does exist on source type";
                }
                return;
            }
            // a mapped destination member should exist on the source type.
            if (!srcObj.hasOwnProperty(member)) {
                return "Destination member '" + member + "' is configured to be mapped, but does not exist on source type";
            }
            //var dstMember = propertyMapping.destinationProperty;
            return undefined;
        };
        AutoMapperValidator.validateProperty = function (srcMember, dstObj) {
            if (!dstObj.hasOwnProperty(srcMember)) {
                return "Source member '" + srcMember + "' is configured to be mapped, but does not exist on destination type";
            }
            return undefined;
        };
        return AutoMapperValidator;
    }());
    AutoMapperJs.AutoMapperValidator = AutoMapperValidator;
})(AutoMapperJs || (AutoMapperJs = {}));

//# sourceMappingURL=AutoMapperValidator.js.map
