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
            // var sourceProperties: string[] = [];
            var atLeastOnePropertyMapped = false;
            // handle mapped properties ...
            for (var _i = 0, _a = mapping.properties; _i < _a.length; _i++) {
                var property = _a[_i];
                // sourceProperties.push(property.name);
                atLeastOnePropertyMapped = true;
                propertyFunction(property.name);
            }
            // .. and, after that, handle unmapped properties
            for (var sourcePropertyName in sourceObject) {
                if (!sourceObject.hasOwnProperty(sourcePropertyName)) {
                    continue;
                }
                atLeastOnePropertyMapped = true;
                propertyFunction(sourcePropertyName);
            }
            // return null/undefined sourceObject if no properties added
            if (!atLeastOnePropertyMapped && (sourceObject === null || sourceObject === undefined)) {
                return sourceObject;
            }
            return destinationObject;
        };
        AutoMapperBase.prototype.handleProperty = function (mapping, sourceObject, sourcePropertyName, destinationObject, transformFunction, autoMappingCallbackFunction) {
            // TODO Property mappings are already located before
            // TODO handleProperty seems only to be called when processing a mapped property.
            var propertyMappings = this.getPropertyMappings(mapping.properties, sourcePropertyName);
            if (propertyMappings.length > 0) {
                for (var _i = 0, propertyMappings_1 = propertyMappings; _i < propertyMappings_1.length; _i++) {
                    var propertyMapping = propertyMappings_1[_i];
                    this.processMappedProperty(mapping, propertyMapping, sourceObject, sourcePropertyName, transformFunction);
                }
            }
            else {
                this.handlePropertyWithAutoMapping(mapping, sourceObject, sourcePropertyName, destinationObject, autoMappingCallbackFunction);
            }
        };
        AutoMapperBase.prototype.setPropertyValue = function (mapping, destinationProperty, destinationObject, destinationPropertyValue) {
            if (mapping.forAllMemberMappings.length > 0) {
                for (var _i = 0, _a = mapping.forAllMemberMappings; _i < _a.length; _i++) {
                    var forAllMemberMapping = _a[_i];
                    forAllMemberMapping(destinationObject, destinationProperty.name, destinationPropertyValue);
                }
            }
            else {
                destinationObject[destinationProperty.name] = destinationPropertyValue;
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
        AutoMapperBase.prototype.shouldProcessDestination = function (destination, sourceObject) {
            if (destination.ignore) {
                // ignore ignored properties
                return false;
            }
            if (destination.conditionFunction) {
                // check for condition function, and, if there is ...
                if (destination.conditionFunction(sourceObject) === false) {
                    // ... return when the condition is not met.
                    return false;
                }
            }
            return true;
        };
        // protected throwMappingException(propertyMapping: IProperty, message: string): void {
        //     throw new Error(`Cannot map '${propertyMapping.sourcePropertyName}' to '${propertyMapping.destinationPropertyName}' => ${message}`);
        // }
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
        AutoMapperBase.prototype.getPropertyMappings = function (properties, sourcePropertyName) {
            var result = [];
            for (var _i = 0, properties_1 = properties; _i < properties_1.length; _i++) {
                var property = properties_1[_i];
                if (property.name === sourcePropertyName) {
                    result.push(property);
                }
            }
            return result;
        };
        AutoMapperBase.prototype.processMappedProperty = function (mapping, propertyMapping, sourceObject, sourcePropertyName, transformFunction) {
            if (propertyMapping.children && propertyMapping.children.length > 0) {
                // always pass child source object, even if source object does not exist =>
                // constant transformations should always pass.
                var childSourceObject = sourceObject ? sourceObject[propertyMapping.name] : null;
                for (var _i = 0, _a = propertyMapping.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    this.processMappedProperty(mapping, child, childSourceObject, child.name, transformFunction);
                    return;
                }
            }
            var destination = propertyMapping.destination;
            // if (!propertyMapping.destination) {
            //     // it makes no sense to handle a property without destination(s).
            //     this.throwMappingException(propertyMapping, 'no destination object');
            // }
            var configurationOptions = this.createMemberConfigurationOptions(sourceObject, sourcePropertyName);
            transformFunction(destination, configurationOptions);
        };
        AutoMapperBase.prototype.createMemberConfigurationOptions = function (sourceObject, sourcePropertyName) {
            var memberConfigurationOptions = {
                mapFrom: function (sourcePropertyName) {
                    // no action required, just here as a stub to prevent calling a non-existing 'opts.mapFrom(...)' function.
                },
                condition: function (predicate) {
                    // no action required, just here as a stub to prevent calling a non-existing 'opts.condition(...)' function.
                },
                ignore: function () {
                    // no action required, just here as a stub to prevent calling a non-existing 'opts.ignore()' function.
                },
                sourceObject: sourceObject,
                sourcePropertyName: sourcePropertyName,
                intermediatePropertyValue: sourceObject ? sourceObject[sourcePropertyName] : sourceObject
            };
            return memberConfigurationOptions;
        };
        return AutoMapperBase;
    }());
    AutoMapperJs.AutoMapperBase = AutoMapperBase;
})(AutoMapperJs || (AutoMapperJs = {}));

//# sourceMappingURL=AutoMapperBase.js.map
