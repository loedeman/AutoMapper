/// <reference path="../../dist/automapper-interfaces.d.ts" />
/// <reference path="TypeConverter.ts" />
/// <reference path="AutoMapperHelper.ts" />
/// <reference path="AutoMapperValidator.ts" />
var AutoMapperJs;
(function (AutoMapperJs) {
    'use strict';
    /**
     * AutoMapper implementation, for both creating maps and performing maps. Comparable usage and functionality to the original
     * .NET AutoMapper library is the pursuit of this implementation.
     */
    var AutoMapperBase = (function () {
        function AutoMapperBase() {
        }
        AutoMapperBase.prototype.getMapping = function (mappings, sourceKey, destinationKey) {
            var srcKey = this.getKey(sourceKey);
            var dstKey = this.getKey(destinationKey);
            var mapping = mappings[srcKey + dstKey];
            if (!mapping) {
                throw new Error("Could not find map object with a source of " + srcKey + " and a destination of " + dstKey);
            }
            return mapping;
        };
        AutoMapperBase.prototype.getKey = function (keyStringOrType) {
            if (typeof keyStringOrType === 'string') {
                return keyStringOrType;
            }
            else {
                return AutoMapperJs.AutoMapperHelper.getClassName(keyStringOrType);
            }
        };
        AutoMapperBase.prototype.isArray = function (sourceObject) {
            return sourceObject instanceof Array;
        };
        AutoMapperBase.prototype.handleArray = function (mapping, sourceArray, itemFunc) {
            var arrayLength = sourceArray.length;
            var destinationArray = new Array(sourceArray.length);
            for (var index = 0; index < arrayLength; index++) {
                var sourceObject = sourceArray[index];
                var destinationObject = void 0;
                if (sourceObject === null || sourceObject === undefined) {
                    destinationObject = sourceObject;
                }
                else {
                    destinationObject = this.createDestinationObject(mapping.destinationTypeClass);
                    itemFunc(sourceObject, destinationObject);
                }
                destinationArray[index] = destinationObject;
            }
            return destinationArray;
        };
        AutoMapperBase.prototype.handleItem = function (mapping, sourceObject, destinationObject, propertyFunction) {
            var sourceProperties = [];
            var atLeastOnePropertyMapped = false;
            for (var sourcePropertyName in sourceObject) {
                if (!sourceObject.hasOwnProperty(sourcePropertyName)) {
                    continue;
                }
                atLeastOnePropertyMapped = true;
                sourceProperties.push(sourcePropertyName);
                propertyFunction(sourcePropertyName);
            }
            // unsourced properties
            for (var _i = 0, _a = mapping.properties; _i < _a.length; _i++) {
                var property = _a[_i];
                if (sourceProperties.indexOf(property.name) >= 0) {
                    continue;
                }
                atLeastOnePropertyMapped = true;
                propertyFunction(property.name);
            }
            // return null/undefined sourceObject if no properties added
            if (!atLeastOnePropertyMapped && sourceObject === null || sourceObject === undefined) {
                return sourceObject;
            }
            return destinationObject;
        };
        AutoMapperBase.prototype.handleProperty = function (mapping, sourceObject, sourcePropertyName, destinationObject, loopMemberValuesAndFunctions, autoMappingCallbackFunction) {
            var propertyMapping = this.getMappingProperty(mapping.properties, sourcePropertyName);
            if (propertyMapping) {
                this.handlePropertyWithPropertyMapping(mapping, propertyMapping, sourceObject, sourcePropertyName, loopMemberValuesAndFunctions);
            }
            else {
                this.handlePropertyWithAutoMapping(mapping, sourceObject, sourcePropertyName, destinationObject, autoMappingCallbackFunction);
            }
        };
        AutoMapperBase.prototype.setPropertyValue = function (mapping, destinationObject, destinationProperty, destinationPropertyValue) {
            if (mapping.forAllMemberMappings.length > 0) {
                for (var _i = 0, _a = mapping.forAllMemberMappings; _i < _a.length; _i++) {
                    var forAllMemberMapping = _a[_i];
                    this.handleNestedForAllMemberMappings(destinationObject, destinationProperty, destinationPropertyValue, forAllMemberMapping);
                }
            }
            else {
                this.setNestedPropertyValue(destinationObject, destinationProperty, destinationPropertyValue);
            }
        };
        AutoMapperBase.prototype.setPropertyValueByName = function (mapping, destinationObject, destinationProperty, destinationPropertyValue) {
            if (mapping.forAllMemberMappings.length > 0) {
                for (var _i = 0, _a = mapping.forAllMemberMappings; _i < _a.length; _i++) {
                    var forAllMemberMapping = _a[_i];
                    forAllMemberMapping(destinationObject, destinationProperty, destinationPropertyValue);
                }
            }
            else {
                destinationObject[destinationProperty] = destinationPropertyValue;
            }
        };
        AutoMapperBase.prototype.createDestinationObject = function (destinationType) {
            // create empty destination object.
            return destinationType
                ? new destinationType()
                : {};
        };
        AutoMapperBase.prototype.handleNestedForAllMemberMappings = function (destinationObject, destinationProperty, destinationPropertyValue, forAllMemberMapping) {
            if (destinationProperty.children && destinationProperty.children.length > 0) {
                this.setChildPropertyValues(destinationObject, destinationProperty, destinationPropertyValue);
            }
            else {
                forAllMemberMapping(destinationObject, destinationProperty.name, destinationPropertyValue);
            }
        };
        AutoMapperBase.prototype.setNestedPropertyValue = function (destinationObject, destinationProperty, destinationPropertyValue) {
            if (destinationProperty.children && destinationProperty.children.length > 0) {
                var isSuccess = this.setChildPropertyValues(destinationObject, destinationProperty, destinationPropertyValue);
                if (!isSuccess) {
                    destinationObject[destinationProperty.name] = destinationPropertyValue;
                }
                return isSuccess;
            }
            else {
                destinationObject[destinationProperty.name] = destinationPropertyValue;
                return destinationPropertyValue !== undefined && destinationPropertyValue !== null;
            }
        };
        AutoMapperBase.prototype.setChildPropertyValues = function (destinationObject, destinationProperty, destinationPropertyValue) {
            var dstObj = {};
            var destinationAlreadyExists = destinationObject.hasOwnProperty(destinationProperty.name) && destinationObject[destinationProperty.name];
            var isSuccess;
            for (var index = 0, count = destinationProperty.children.length; index < count; index++) {
                var tmpObj = {};
                var child = destinationProperty.children[index];
                var isChildSucces = this.setNestedPropertyValue(tmpObj, child, destinationPropertyValue);
                if (isChildSucces) {
                    dstObj[child.name] = tmpObj[child.name];
                }
                isSuccess = isSuccess || isChildSucces;
            }
            if (isSuccess) {
                if (destinationAlreadyExists) {
                    for (var child_1 in dstObj) {
                        if (!dstObj.hasOwnProperty(child_1)) {
                            continue;
                        }
                        destinationObject[destinationProperty.name][child_1] = dstObj[child_1];
                    }
                }
                else {
                    destinationObject[destinationProperty.name] = dstObj;
                }
            }
            return destinationAlreadyExists || isSuccess;
        };
        AutoMapperBase.prototype.getMappingProperty = function (properties, sourcePropertyName) {
            for (var _i = 0, properties_1 = properties; _i < properties_1.length; _i++) {
                var property = properties_1[_i];
                if (property.name === sourcePropertyName) {
                    return property;
                }
            }
            return null;
        };
        AutoMapperBase.prototype.handlePropertyWithAutoMapping = function (mapping, sourceObject, sourcePropertyName, destinationObject, autoMappingCallbackFunction) {
            // no forMember mapping exists, auto map properties, except for the situation where ignoreAllNonExisting is specified.
            if (mapping.ignoreAllNonExisting) {
                return;
            }
            if (mapping.destinationTypeClass && Object.keys(destinationObject).indexOf(sourcePropertyName) < 0) {
                return;
            }
            var objectValue = null;
            var isNestedObject = false;
            if (typeof destinationObject[sourcePropertyName] === 'object' && destinationObject[sourcePropertyName]) {
                isNestedObject = (destinationObject[sourcePropertyName].constructor.name !== 'Object');
                if (isNestedObject) {
                    this
                        .createMap(sourceObject[sourcePropertyName].constructor.name, destinationObject[sourcePropertyName].constructor.name)
                        .convertToType(destinationObject[sourcePropertyName].constructor);
                    objectValue = this.map(sourceObject[sourcePropertyName].constructor.name, destinationObject[sourcePropertyName].constructor.name, sourceObject[sourcePropertyName]);
                }
            }
            // use profile mapping when specified; otherwise, specify source property name as destination property name.
            var destinationPropertyName = this.getDestinationPropertyName(mapping.profile, sourcePropertyName);
            var destinationPropertyValue = this.getDestinationPropertyValue(sourceObject, sourcePropertyName, objectValue, isNestedObject);
            this.setPropertyValueByName(mapping, destinationObject, destinationPropertyName, destinationPropertyValue);
            if (autoMappingCallbackFunction) {
                autoMappingCallbackFunction(destinationPropertyValue);
            }
        };
        AutoMapperBase.prototype.getDestinationPropertyValue = function (sourceObject, sourcePropertyName, objectValue, isNestedObject) {
            if (isNestedObject) {
                return objectValue;
            }
            return sourceObject ? sourceObject[sourcePropertyName] : null;
        };
        AutoMapperBase.prototype.handlePropertyWithPropertyMapping = function (mapping, propertyMapping, sourceObject, sourcePropertyName, loopMemberValuesAndFunctions) {
            // a forMember mapping exists
            var ignore = propertyMapping.ignore, conditionFunction = propertyMapping.conditionFunction, children = propertyMapping.children, destinations = propertyMapping.destinations, conversionValuesAndFunctions = propertyMapping.conversionValuesAndFunctions;
            if (children) {
                var childSourceObject = sourceObject[propertyMapping.name];
                for (var index = 0; index < children.length; index++) {
                    var child = children[index];
                    this.handlePropertyWithPropertyMapping(mapping, child, childSourceObject, child.name, loopMemberValuesAndFunctions);
                }
            }
            // ignore ignored properties
            if (ignore) {
                return;
            }
            // check for condition function
            if (conditionFunction) {
                // and, if there, return when the condition is not met.
                if (conditionFunction(sourceObject) === false) {
                    return;
                }
            }
            // it makes no sense to handle a property without destination(s).
            if (!destinations) {
                return;
            }
            var memberConfigurationOptions = {
                mapFrom: function () {
                    // no action required, just here as a stub to prevent calling a non-existing 'opts.mapFrom()' function.
                },
                condition: function (predicate) {
                    // no action required, just here as a stub to prevent calling a non-existing 'opts.mapFrom()' function.
                },
                sourceObject: sourceObject,
                sourcePropertyName: sourcePropertyName,
                intermediatePropertyValue: sourceObject ? sourceObject[sourcePropertyName] : sourceObject
            };
            loopMemberValuesAndFunctions(destinations, conversionValuesAndFunctions, memberConfigurationOptions);
        };
        AutoMapperBase.prototype.getDestinationPropertyName = function (profile, sourcePropertyName) {
            if (!profile) {
                return sourcePropertyName;
            }
            // TODO BL no support yet for INamingConvention.splittingCharacter
            try {
                // First, split the source property name based on the splitting expression.
                // TODO BL Caching of RegExp splitting!
                var sourcePropertyNameParts = sourcePropertyName.split(profile.sourceMemberNamingConvention.splittingExpression);
                // NOTE BL For some reason, splitting by (my ;)) RegExp results in empty strings in the array; remove them.
                for (var index = sourcePropertyNameParts.length - 1; index >= 0; index--) {
                    if (sourcePropertyNameParts[index] === '') {
                        sourcePropertyNameParts.splice(index, 1);
                    }
                }
                return profile.destinationMemberNamingConvention.transformPropertyName(sourcePropertyNameParts);
            }
            catch (error) {
                return sourcePropertyName;
            }
        };
        return AutoMapperBase;
    }());
    AutoMapperJs.AutoMapperBase = AutoMapperBase;
})(AutoMapperJs || (AutoMapperJs = {}));

//# sourceMappingURL=AutoMapperBase.js.map
