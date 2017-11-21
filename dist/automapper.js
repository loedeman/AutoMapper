/*!
 * TypeScript / Javascript AutoMapper Library v1.9.0
 * https://github.com/loedeman/AutoMapper
 *
 * Copyright 2015-2017 Interest IT / Bert Loedeman and other contributors
 * Released under the MIT license
 *
 * Date: 2017-11-21T17:00:00.000Z
 */
;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.Automapper = factory();
  }
}(this, function() {
/// <reference path="AutoMapperEnumerations.ts" />
var AutoMapperJs;
(function (AutoMapperJs) {
    'use strict';
    /**
     * AutoMapper helper functions
     */
    var AutoMapperHelper = (function () {
        function AutoMapperHelper() {
        }
        AutoMapperHelper.getClassName = function (classType) {
            if (classType && classType.name) {
                return classType.name;
            }
            // source: http://stackoverflow.com/a/13914278/702357
            if (classType && classType.constructor) {
                var className = classType.toString();
                if (className) {
                    // classType.toString() is "function classType (...) { ... }"
                    var matchParts = className.match(/function\s*(\w+)/);
                    if (matchParts && matchParts.length === 2) {
                        return matchParts[1];
                    }
                }
                // for browsers which have name property in the constructor
                // of the object, such as chrome
                if (classType.constructor.name) {
                    return classType.constructor.name;
                }
                if (classType.constructor.toString()) {
                    var str = classType.constructor.toString();
                    var regExpMatchArray = void 0;
                    if (str.charAt(0) === '[') {
                        // executed if the return of object.constructor.toString() is "[object objectClass]"
                        regExpMatchArray = str.match(/\[\w+\s*(\w+)\]/);
                    }
                    else {
                        // executed if the return of object.constructor.toString() is "function objectClass () {}"
                        // (IE and Firefox)
                        regExpMatchArray = str.match(/function\s*(\w+)/);
                    }
                    if (regExpMatchArray && regExpMatchArray.length === 2) {
                        return regExpMatchArray[1];
                    }
                }
            }
            throw new Error("Unable to extract class name from type '" + classType + "'");
        };
        AutoMapperHelper.getFunctionParameters = function (functionStr) {
            var stripComments = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
            var argumentNames = /([^\s,]+)/g;
            var functionString = functionStr.replace(stripComments, '');
            var functionParameterNames = functionString.slice(functionString.indexOf('(') + 1, functionString.indexOf(')')).match(argumentNames);
            if (functionParameterNames === null) {
                functionParameterNames = new Array();
            }
            return functionParameterNames;
        };
        AutoMapperHelper.handleCurrying = function (func, args, closure) {
            var argumentsStillToCome = func.length - args.length;
            // saved accumulator array
            // NOTE BL this does not deep copy array objects, only the array itself; should side effects occur, please report (or refactor).
            var argumentsCopy = Array.prototype.slice.apply(args);
            function accumulator(moreArgs, alreadyProvidedArgs, stillToCome) {
                var previousAlreadyProvidedArgs = alreadyProvidedArgs.slice(0); // to reset
                var previousStillToCome = stillToCome; // to reset
                for (var i = 0; i < moreArgs.length; i++, stillToCome--) {
                    alreadyProvidedArgs[alreadyProvidedArgs.length] = moreArgs[i];
                }
                if (stillToCome - moreArgs.length <= 0) {
                    var functionCallResult = func.apply(closure, alreadyProvidedArgs);
                    // reset vars, so curried function can be applied to new params.
                    alreadyProvidedArgs = previousAlreadyProvidedArgs;
                    stillToCome = previousStillToCome;
                    return functionCallResult;
                }
                else {
                    return function () {
                        // arguments are params, so closure bussiness is avoided.
                        return accumulator(arguments, alreadyProvidedArgs.slice(0), stillToCome);
                    };
                }
            }
            return accumulator([], argumentsCopy, argumentsStillToCome);
        };
        AutoMapperHelper.getMappingMetadataFromTransformationFunction = function (destination, func, sourceMapping) {
            if (typeof func !== 'function') {
                return {
                    destination: destination,
                    source: destination,
                    transformation: AutoMapperHelper.getDestinationTransformation(func, false, sourceMapping, false),
                    sourceMapping: sourceMapping,
                    condition: null,
                    ignore: false,
                    async: false
                };
            }
            var functionStr = func.toString();
            var parameterNames = AutoMapperHelper.getFunctionParameters(functionStr);
            var optsParamName = parameterNames.length >= 1 ? parameterNames[0] : '';
            var source = sourceMapping
                ? destination
                : AutoMapperHelper.getMapFromString(functionStr, destination, optsParamName);
            var metadata = {
                destination: destination,
                source: source,
                transformation: AutoMapperHelper.getDestinationTransformation(func, true, sourceMapping, parameterNames.length === 2),
                sourceMapping: sourceMapping,
                condition: null,
                ignore: AutoMapperHelper.getIgnoreFromString(functionStr, destination),
                async: parameterNames.length === 2
            };
            // calling the member options function when used asynchronous would be too 'dangerous'.
            if (!metadata.async && AutoMapperHelper.getFunctionCallIndex(functionStr, 'condition', optsParamName) >= 0) {
                metadata.condition = AutoMapperHelper.getConditionFromFunction(func, source);
            }
            return metadata;
        };
        AutoMapperHelper.getDestinationTransformation = function (func, isFunction, sourceMapping, async) {
            if (!isFunction) {
                return {
                    transformationType: AutoMapperJs.DestinationTransformationType.Constant,
                    constant: func
                };
            }
            var transformation;
            if (sourceMapping) {
                if (async) {
                    transformation = {
                        transformationType: AutoMapperJs.DestinationTransformationType.AsyncSourceMemberOptions,
                        asyncSourceMemberConfigurationOptionsFunc: func
                    };
                }
                else {
                    transformation = {
                        transformationType: AutoMapperJs.DestinationTransformationType.SourceMemberOptions,
                        sourceMemberConfigurationOptionsFunc: func
                    };
                }
            }
            else {
                if (async) {
                    transformation = {
                        transformationType: AutoMapperJs.DestinationTransformationType.AsyncMemberOptions,
                        asyncMemberConfigurationOptionsFunc: func
                    };
                }
                else {
                    transformation = {
                        transformationType: AutoMapperJs.DestinationTransformationType.MemberOptions,
                        memberConfigurationOptionsFunc: func
                    };
                }
            }
            return transformation;
        };
        AutoMapperHelper.getIgnoreFromString = function (functionString, optionsParameterName) {
            var indexOfIgnore = AutoMapperHelper.getFunctionCallIndex(functionString, 'ignore', optionsParameterName);
            if (indexOfIgnore < 0) {
                return false;
            }
            var indexOfMapFromStart = functionString.indexOf('(', indexOfIgnore) + 1;
            var indexOfMapFromEnd = functionString.indexOf(')', indexOfMapFromStart);
            if (indexOfMapFromStart < 0 || indexOfMapFromEnd < 0) {
                return false;
            }
            var ignoreString = functionString.substring(indexOfMapFromStart, indexOfMapFromEnd).replace(/\r/g, '').replace(/\n/g, '').trim();
            return ignoreString === null || ignoreString === ''
                ? true // <optionsParameterName>.ignore()
                : false; // <optionsParameterName>.ignore(<ignoreString> -> unexpected content)
        };
        AutoMapperHelper.getMapFromString = function (functionString, defaultValue, optionsParameterName) {
            var indexOfMapFrom = AutoMapperHelper.getFunctionCallIndex(functionString, 'mapFrom', optionsParameterName);
            if (indexOfMapFrom < 0) {
                return defaultValue;
            }
            var indexOfMapFromStart = functionString.indexOf('(', indexOfMapFrom) + 1;
            var indexOfMapFromEnd = functionString.indexOf(')', indexOfMapFromStart);
            if (indexOfMapFromStart < 0 || indexOfMapFromEnd < 0) {
                return defaultValue;
            }
            var mapFromString = functionString.substring(indexOfMapFromStart, indexOfMapFromEnd).replace(/'/g, '').replace(/"/g, '').trim();
            return mapFromString === null || mapFromString === ''
                ? defaultValue
                : mapFromString;
        };
        AutoMapperHelper.getFunctionCallIndex = function (functionString, functionToLookFor, optionsParameterName) {
            var indexOfFunctionCall = functionString.indexOf(optionsParameterName + '.' + functionToLookFor);
            if (indexOfFunctionCall < 0) {
                indexOfFunctionCall = functionString.indexOf('.' + functionToLookFor);
            }
            return indexOfFunctionCall;
        };
        AutoMapperHelper.getConditionFromFunction = function (func, sourceProperty) {
            // Since we are calling the valueOrFunction function to determine whether to ignore or map from another property, we
            // want to prevent the call to be error prone when the end user uses the '(opts)=> opts.sourceObject.sourcePropertyName'
            // syntax. We don't actually have a source object when creating a mapping; therefore, we 'stub' a source object for the
            // function call.
            var sourceObject = {};
            sourceObject[sourceProperty] = {};
            var condition;
            // calling the function will result in calling our stubbed ignore() and mapFrom() functions if used inside the function.
            var configFuncOptions = {
                ignore: function () {
                    // do nothing
                },
                condition: function (predicate) {
                    condition = predicate;
                },
                mapFrom: function (sourcePropertyName) {
                    // do nothing
                },
                sourceObject: sourceObject,
                sourcePropertyName: sourceProperty,
                intermediatePropertyValue: {}
            };
            try {
                func(configFuncOptions);
            }
            catch (exc) {
                // do not handle by default.
            }
            return condition;
        };
        return AutoMapperHelper;
    }());
    AutoMapperJs.AutoMapperHelper = AutoMapperHelper;
})(AutoMapperJs || (AutoMapperJs = {}));

//# sourceMappingURL=AutoMapperHelper.js.map

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
            // awkward way of locating sourceMapping ;) ...
            var destinationProperty = AutoMapperValidator.getDestinationProperty(propertyMapping.destinationPropertyName, propertyMapping);
            return destinationProperty.sourceMapping
                ? AutoMapperValidator.validateSourcePropertyMapping(propertyMapping, destinationProperty, member, srcObj, dstObj)
                : AutoMapperValidator.validateDestinationPropertyMapping(propertyMapping, destinationProperty, member, srcObj, dstObj);
        };
        AutoMapperValidator.validateSourcePropertyMapping = function (ropertyMapping, destinationProperty, member, srcObj, dstObj) {
            // a member for which configuration is provided, should exist.
            if (!srcObj.hasOwnProperty(member)) {
                return "Source member '" + member + "' is configured, but does not exist on source type";
            }
            // an ignored source member should not exist on the destination type.
            if (destinationProperty.ignore) {
                if (dstObj.hasOwnProperty(member)) {
                    return "Source member '" + member + "' is ignored, but does exist on destination type";
                }
                return undefined;
            }
            // a mapped source member should exist on the destination type.
            if (!dstObj.hasOwnProperty(member)) {
                return "Source member '" + member + "' is configured to be mapped, but does not exist on destination type";
            }
            //var dstMember = propertyMapping.destinationProperty;
            return undefined;
        };
        AutoMapperValidator.validateDestinationPropertyMapping = function (propertyMapping, destinationProperty, member, srcObj, dstObj) {
            // a member for which configuration is provided, should exist.
            if (!dstObj.hasOwnProperty(destinationProperty.name)) {
                return "Destination member '" + destinationProperty.destinationPropertyName + "' is configured, but does not exist on destination type";
            }
            // an ignored destination member should not exist on the source type.
            if (destinationProperty.ignore) {
                if (srcObj.hasOwnProperty(member)) {
                    return "Destination member '" + member + "' is ignored, but does exist on source type";
                }
                return undefined;
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
        AutoMapperValidator.getDestinationProperty = function (destinationPropertyName, existingSource) {
            if (existingSource.destination) {
                return existingSource.destination;
            }
            if (existingSource.children) {
                for (var _i = 0, _a = existingSource.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    var destination = this.getDestinationProperty(destinationPropertyName, child);
                    if (destination) {
                        return destination;
                    }
                }
            }
            return null;
        };
        return AutoMapperValidator;
    }());
    AutoMapperJs.AutoMapperValidator = AutoMapperValidator;
})(AutoMapperJs || (AutoMapperJs = {}));

//# sourceMappingURL=AutoMapperValidator.js.map

var AutoMapperJs;
(function (AutoMapperJs) {
    'use strict';
    var DestinationTransformationType;
    (function (DestinationTransformationType) {
        DestinationTransformationType[DestinationTransformationType["Constant"] = 1] = "Constant";
        DestinationTransformationType[DestinationTransformationType["MemberOptions"] = 2] = "MemberOptions";
        DestinationTransformationType[DestinationTransformationType["AsyncMemberOptions"] = 4] = "AsyncMemberOptions";
        DestinationTransformationType[DestinationTransformationType["SourceMemberOptions"] = 8] = "SourceMemberOptions";
        DestinationTransformationType[DestinationTransformationType["AsyncSourceMemberOptions"] = 16] = "AsyncSourceMemberOptions";
    })(DestinationTransformationType = AutoMapperJs.DestinationTransformationType || (AutoMapperJs.DestinationTransformationType = {}));
})(AutoMapperJs || (AutoMapperJs = {}));

//# sourceMappingURL=AutoMapperEnumerations.js.map

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

/// <reference path="../../dist/automapper-interfaces.d.ts" />
/// <reference path="AutoMapper.ts" />
/// <reference path="TypeConverter.ts" />
/// <reference path="AutoMapperHelper.ts" />
/// <reference path="AutoMapperValidator.ts" />
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
var AutoMapperJs;
(function (AutoMapperJs) {
    'use strict';
    /**
     * AsyncAutoMapper implementation, for asynchronous mapping support when using AutoMapper.
     */
    var AsyncAutoMapper = (function (_super) {
        __extends(AsyncAutoMapper, _super);
        function AsyncAutoMapper() {
            var _this = _super.call(this) || this;
            AsyncAutoMapper.asyncInstance = _this;
            return _this;
        }
        AsyncAutoMapper.prototype.createMap = function (sourceKeyOrType, destinationKeyOrType) {
            throw new Error('Method AsyncAutoMapper.createMap is not implemented.');
        };
        AsyncAutoMapper.prototype.createMapForMember = function (mapping, property) {
            var _this = this;
            mapping.async = true;
            mapping.mapItemFunction = function (m, srcObj, dstObj, cb) { return _this.mapItem(m, srcObj, dstObj, cb); };
            // property.async = true;
            // property.conversionValuesAndFunctions.push(func);
        };
        AsyncAutoMapper.prototype.createMapConvertUsing = function (mapping, converterFunction) {
            var _this = this;
            mapping.async = true;
            mapping.typeConverterFunction = converterFunction;
            mapping.mapItemFunction = function (m, srcObj, dstObj, cb) { return _this.mapItemUsingTypeConverter(m, srcObj, dstObj, cb); };
        };
        AsyncAutoMapper.prototype.map = function (mappings, sourceKey, destinationKey, sourceObject, callback) {
            var _this = this;
            switch (arguments.length) {
                case 5:
                    this.mapWithMapping(_super.prototype.getMapping.call(this, mappings, sourceKey, destinationKey), sourceObject, callback);
                    return;
                // provide performance optimized (preloading) currying support.
                case 4:
                    return function (cb) { return _this.mapWithMapping(_super.prototype.getMapping.call(_this, mappings, sourceKey, destinationKey), sourceObject, cb); };
                case 3:
                    return function (srcObj, cb) { return _this.mapWithMapping(_super.prototype.getMapping.call(_this, mappings, sourceKey, destinationKey), srcObj, cb); };
                case 2:
                    return function (dstKey, srcObj, cb) { return _this.map(mappings, sourceKey, dstKey, srcObj, cb); };
                default:
                    throw new Error('The AsyncAutoMapper.map function expects between 2 and 5 parameters, you provided ' + arguments.length + '.');
            }
        };
        AsyncAutoMapper.prototype.mapWithMapping = function (mapping, sourceObject, callback) {
            if (_super.prototype.isArray.call(this, sourceObject)) {
                this.mapArray(mapping, sourceObject, callback);
                return;
            }
            return mapping.mapItemFunction(mapping, sourceObject, _super.prototype.createDestinationObject.call(this, mapping.destinationTypeClass), callback);
        };
        /**
         * Execute a mapping from the source array to a new destination array with explicit mapping configuration and supplied mapping options (using createMap).
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param sourceArray The source array to map.
         * @returns {Array<any>} Destination array.
         */
        AsyncAutoMapper.prototype.mapArray = function (mapping, sourceArray, callback) {
            var callbacksToGo = 0;
            var destinationArray = _super.prototype.handleArray.call(this, mapping, sourceArray, function (sourceObject, destinationObject) {
                callbacksToGo++;
                mapping.mapItemFunction(mapping, sourceObject, destinationObject, function (result) {
                    callbacksToGo--;
                });
            });
            var waitForCallbackToSend = function () {
                if (callbacksToGo === 0) {
                    callback(destinationArray);
                }
                else {
                    setTimeout(function () {
                        waitForCallbackToSend();
                    }, 10 * callbacksToGo);
                }
            };
            waitForCallbackToSend();
        };
        AsyncAutoMapper.prototype.mapItemUsingTypeConverter = function (mapping, sourceObject, destinationObject, callback) {
            var resolutionContext = {
                sourceValue: sourceObject,
                destinationValue: destinationObject
            };
            mapping.typeConverterFunction(resolutionContext, callback);
        };
        /**
         * Execute a mapping from the source object to a new destination object with explicit mapping configuration and supplied mapping options (using createMap).
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param sourceObject The source object to map.
         * @param destinationObject The destination object to map to.
         * @param callback The callback to call after async mapping has been executed.
         */
        AsyncAutoMapper.prototype.mapItem = function (mapping, sourceObject, destinationObject, callback) {
            var _this = this;
            var callbacksToGo = 0;
            _super.prototype.handleItem.call(this, mapping, sourceObject, destinationObject, function (sourceProperty) {
                callbacksToGo++;
                _this.mapProperty(mapping, sourceObject, sourceProperty, destinationObject, function (result) {
                    callbacksToGo--;
                });
            });
            var waitForCallbackToSend = function () {
                if (callbacksToGo === 0) {
                    callback(destinationObject);
                }
                else {
                    setTimeout(function () {
                        waitForCallbackToSend();
                    }, 10 * callbacksToGo);
                }
            };
            waitForCallbackToSend();
        };
        /**
         * Execute a mapping from the source object property to the destination object property with explicit mapping configuration and supplied mapping options.
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param sourceObject The source object to map.
         * @param sourcePropertyName The source property to map.
         * @param destinationObject The destination object to map to.
         * @param callback The callback to call after async property mapping has been executed.
         */
        AsyncAutoMapper.prototype.mapProperty = function (mapping, sourceObject, sourceProperty, destinationObject, callback) {
            var _this = this;
            _super.prototype.handleProperty.call(this, mapping, sourceObject, sourceProperty, destinationObject, function (destinationProperty, options) {
                _this.transform(mapping, sourceObject, destinationProperty, destinationObject, options, function (destinationPropertyValue, success) {
                    callback(destinationPropertyValue);
                });
            }, function (destinationPropertyValue) {
                callback(destinationPropertyValue);
            });
        };
        AsyncAutoMapper.prototype.transform = function (mapping, sourceObject, destinationProperty, destinationObject, options, callback) {
            var _this = this;
            var childDestinationProperty = destinationProperty.child;
            if (childDestinationProperty) {
                var childDestinationObject = destinationObject[destinationProperty.name];
                if (!childDestinationObject) {
                    // no child source object? create.
                    childDestinationObject = {};
                }
                // transform child by recursively calling the transform function.
                this.transform(mapping, sourceObject, childDestinationProperty, childDestinationObject, options, function (callbackValue, success) {
                    if (success) {
                        // only set child destination object when transformation has been successful.
                        destinationObject[destinationProperty.name] = childDestinationObject;
                    }
                    callback(options.intermediatePropertyValue, success);
                });
                return;
            }
            if (!_super.prototype.shouldProcessDestination.call(this, destinationProperty, sourceObject)) {
                callback(undefined /* opts.intermediatePropertyValue */, false);
                return;
            }
            // actually transform destination property.
            this.processTransformations(destinationProperty, destinationProperty.transformations, options, function (callbackValue, success) {
                if (success) {
                    _super.prototype.setPropertyValue.call(_this, mapping, destinationProperty, destinationObject, options.intermediatePropertyValue);
                }
                callback(options.intermediatePropertyValue, success);
            });
        };
        AsyncAutoMapper.prototype.processTransformations = function (property, transformations, options, callback) {
            var _this = this;
            if (transformations.length === 0) {
                callback(options.intermediatePropertyValue, true);
                return;
            }
            var transformation = transformations[0];
            this.processTransformation(property, transformation, options, function (callbackValue, success) {
                if (!success) {
                    callback(options.intermediatePropertyValue, false);
                    return;
                }
                _this.processTransformations(property, transformations.slice(1), options, callback);
            });
        };
        AsyncAutoMapper.prototype.processTransformation = function (property, transformation, options, callback) {
            switch (transformation.transformationType) {
                case AutoMapperJs.DestinationTransformationType.Constant:
                    options.intermediatePropertyValue = transformation.constant;
                    callback(options.intermediatePropertyValue, true);
                    return;
                case AutoMapperJs.DestinationTransformationType.MemberOptions: {
                    var result = transformation.memberConfigurationOptionsFunc(options);
                    if (typeof result !== 'undefined') {
                        options.intermediatePropertyValue = result;
                    }
                    else if (!options.sourceObject) {
                        callback(options.intermediatePropertyValue, false);
                        return;
                    }
                    callback(options.intermediatePropertyValue, true);
                    return;
                }
                case AutoMapperJs.DestinationTransformationType.SourceMemberOptions: {
                    var result = transformation.sourceMemberConfigurationOptionsFunc(options);
                    if (typeof result !== 'undefined') {
                        options.intermediatePropertyValue = result;
                    }
                    else if (!options.sourceObject) {
                        callback(options.intermediatePropertyValue, false);
                        return;
                    }
                    callback(options.intermediatePropertyValue, true);
                    return;
                }
                case AutoMapperJs.DestinationTransformationType.AsyncMemberOptions:
                    transformation.asyncMemberConfigurationOptionsFunc(options, function (result) {
                        if (typeof result !== 'undefined') {
                            options.intermediatePropertyValue = result;
                        }
                        callback(options.intermediatePropertyValue, true);
                        return;
                    });
                    return;
                case AutoMapperJs.DestinationTransformationType.AsyncSourceMemberOptions:
                    transformation.asyncSourceMemberConfigurationOptionsFunc(options, function (result) {
                        if (typeof result !== 'undefined') {
                            options.intermediatePropertyValue = result;
                        }
                        callback(options.intermediatePropertyValue, true);
                        return;
                    });
                    return;
                default:
                    // TODO: this.throwMappingException(property, `AutoMapper.handlePropertyMappings: Unexpected transformation type ${transformation}`);
                    callback(options.intermediatePropertyValue, false);
                    return;
            }
        };
        return AsyncAutoMapper;
    }(AutoMapperJs.AutoMapperBase));
    AsyncAutoMapper.asyncInstance = new AsyncAutoMapper();
    AutoMapperJs.AsyncAutoMapper = AsyncAutoMapper;
})(AutoMapperJs || (AutoMapperJs = {}));

//# sourceMappingURL=AsyncAutoMapper.js.map

/// <reference path="../../dist/automapper-interfaces.d.ts" />
/// <reference path="AutoMapperEnumerations.ts" />
/// <reference path="AutoMapperBase.ts" />
/// <reference path="AsyncAutoMapper.ts" />
/// <reference path="TypeConverter.ts" />
/// <reference path="AutoMapperHelper.ts" />
/// <reference path="AutoMapperValidator.ts" />
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
var AutoMapperJs;
(function (AutoMapperJs) {
    'use strict';
    var AutoMapper = (function (_super) {
        __extends(AutoMapper, _super);
        /**
         * This class is intended to be a Singleton. Preferrably use getInstance()
         * function instead of using the constructor directly from code.
         */
        function AutoMapper() {
            var _this = _super.call(this) || this;
            if (AutoMapper._instance) {
                return AutoMapper._instance;
            }
            else {
                AutoMapper._instance = _this;
                _this._profiles = {};
                _this._mappings = {};
                _this._asyncMapper = new AutoMapperJs.AsyncAutoMapper();
            }
            return _this;
        }
        AutoMapper.getInstance = function () {
            return AutoMapper._instance;
        };
        /**
         * Initializes the mapper with the supplied configuration.
         * @param {(config: IConfiguration) => void} configFunction Configuration function to call.
         */
        AutoMapper.prototype.initialize = function (configFunction) {
            var that = this;
            var configuration = {
                addProfile: function (profile) {
                    profile.configure();
                    that._profiles[profile.profileName] = profile;
                },
                createMap: function (sourceKey, destinationKey) {
                    // pass through using arguments to keep createMap's currying support fully functional.
                    return that.createMap.apply(that, arguments);
                }
            };
            configFunction(configuration);
        };
        /**
         * Create a mapping profile.
         * @param {string} sourceKey The map source key.
         * @param {string} destinationKey The map destination key.
         * @returns {Core.ICreateMapFluentFunctions}
         */
        AutoMapper.prototype.createMap = function (sourceKeyOrType, destinationKeyOrType) {
            // provide currying support.
            if (arguments.length < 2) {
                return AutoMapperJs.AutoMapperHelper.handleCurrying(this.createMap, arguments, this);
            }
            var mapping = this.createMappingObjectForGivenKeys(sourceKeyOrType, destinationKeyOrType);
            return this.createMapGetFluentApiFunctions(mapping);
        };
        /**
         * Execute a mapping from the source object to a new destination object with explicit mapping configuration and supplied mapping options (using createMap).
         * @param sourceKey Source key, for instance the source type name.
         * @param destinationKey Destination key, for instance the destination type name.
         * @param sourceObject The source object to map.
         * @returns {any} Destination object.
         */
        AutoMapper.prototype.map = function (sourceKeyOrType, destinationKeyOrType, sourceObject) {
            var _this = this;
            if (arguments.length === 3) {
                return this.mapInternal(_super.prototype.getMapping.call(this, this._mappings, sourceKeyOrType, destinationKeyOrType), sourceObject);
            }
            // provide performance optimized (preloading) currying support.
            if (arguments.length === 2) {
                return function (srcObj) { return _this.mapInternal(_super.prototype.getMapping.call(_this, _this._mappings, sourceKeyOrType, destinationKeyOrType), srcObj); };
            }
            if (arguments.length === 1) {
                return function (dstKey, srcObj) { return _this.map(sourceKeyOrType, dstKey, srcObj); };
            }
            return function (srcKey, dstKey, srcObj) { return _this.map(srcKey, dstKey, srcObj); };
        };
        /**
         * Execute an asynchronous mapping from the source object to a new destination object with explicit mapping configuration and supplied mapping options (using createMap).
         * @param sourceKey Source key, for instance the source type name.
         * @param destinationKey Destination key, for instance the destination type name.
         * @param sourceObject The source object to map.
         * @param {IMapCallback} callback The callback to call when asynchronous mapping is complete.
         */
        AutoMapper.prototype.mapAsync = function (sourceKeyOrType, destinationKeyOrType, sourceObject, callback) {
            switch (arguments.length) {
                case 4:
                    return this._asyncMapper.map(this._mappings, sourceKeyOrType, destinationKeyOrType, sourceObject, callback);
                case 3:
                    return this._asyncMapper.map(this._mappings, sourceKeyOrType, destinationKeyOrType, sourceObject);
                case 2:
                    return this._asyncMapper.map(this._mappings, sourceKeyOrType, destinationKeyOrType);
                case 1:
                    return this._asyncMapper.map(this._mappings, sourceKeyOrType);
                default:
                    throw new Error('The mapAsync function expects between 1 and 4 parameters, you provided ' + arguments.length + '.');
            }
        };
        /**
         * Validates mapping configuration by dry-running. Since JS does not fully support typing, it only checks if properties match on both
         * sides. The function needs IMapping.sourceTypeClass and IMapping.destinationTypeClass to function.
         * @param {boolean} strictMode Whether or not to fail when properties sourceTypeClass or destinationTypeClass are unavailable.
         */
        AutoMapper.prototype.assertConfigurationIsValid = function (strictMode) {
            if (strictMode === void 0) { strictMode = true; }
            AutoMapperJs.AutoMapperValidator.assertConfigurationIsValid(this._mappings, strictMode);
        };
        AutoMapper.prototype.createMapForAllMembers = function (mapping, fluentFunc, func) {
            mapping.forAllMemberMappings.push(func);
            return fluentFunc;
        };
        AutoMapper.prototype.createMapIgnoreAllNonExisting = function (mapping, fluentFunc) {
            mapping.ignoreAllNonExisting = true;
            return fluentFunc;
        };
        AutoMapper.prototype.createMapConvertToType = function (mapping, fluentFunc, typeClass) {
            if (mapping.destinationTypeClass) {
                throw new Error('Destination type class can only be set once.');
            }
            mapping.destinationTypeClass = typeClass;
            return fluentFunc;
        };
        AutoMapper.prototype.createMapConvertUsing = function (mapping, tcClassOrFunc) {
            var _this = this;
            var configureSynchronousConverterFunction = function (converterFunc) {
                if (!converterFunc || AutoMapperJs.AutoMapperHelper.getFunctionParameters(converterFunc.toString()).length !== 1) {
                    throw new Error('The function provided does not provide exactly one (resolutionContext) parameter.');
                }
                mapping.typeConverterFunction = converterFunc;
                mapping.mapItemFunction = function (m, srcObj, dstObj) { return _this.mapItemUsingTypeConverter(m, srcObj, dstObj); };
            };
            try {
                // check if sync: TypeConverter instance
                if (tcClassOrFunc instanceof AutoMapperJs.TypeConverter) {
                    configureSynchronousConverterFunction(tcClassOrFunc.convert);
                    return;
                }
                var functionParameters = AutoMapperJs.AutoMapperHelper.getFunctionParameters(tcClassOrFunc.toString());
                switch (functionParameters.length) {
                    case 0:
                        // check if sync: TypeConverter class definition
                        var typeConverter;
                        try {
                            typeConverter = new tcClassOrFunc();
                        }
                        catch (e) {
                            // Obviously, typeConverterClassOrFunction is not a TypeConverter class definition
                        }
                        if (typeConverter instanceof AutoMapperJs.TypeConverter) {
                            configureSynchronousConverterFunction(typeConverter.convert);
                            return;
                        }
                        break;
                    case 1:
                        // sync: function with resolutionContext parameter
                        configureSynchronousConverterFunction(tcClassOrFunc);
                        return;
                    case 2:
                        // check if async: function with resolutionContext and callback parameters
                        this._asyncMapper.createMapConvertUsing(mapping, tcClassOrFunc);
                        return;
                }
                // okay, just try feeding the function to the configure function anyway...
                configureSynchronousConverterFunction(tcClassOrFunc);
            }
            catch (e) {
                throw new Error("The value provided for typeConverterClassOrFunction is invalid. " + e);
            }
        };
        AutoMapper.prototype.createMapWithProfile = function (mapping, profileName) {
            // check if given profile exists
            var profile = this._profiles[profileName];
            if (typeof profile === 'undefined' || profile.profileName !== profileName) {
                throw new Error("Could not find profile with profile name '" + profileName + "'.");
            }
            mapping.profile = profile;
            // merge mappings
            this.createMapWithProfileMergeMappings(mapping, profileName);
        };
        AutoMapper.prototype.createMapWithProfileMergeMappings = function (mapping, profileName) {
            var profileMappingKey = profileName + "=>" + mapping.sourceKey + profileName + "=>" + mapping.destinationKey;
            var profileMapping = this._mappings[profileMappingKey];
            if (!profileMapping) {
                return;
            }
            // append forAllMemberMappings calls to the original array.
            if (profileMapping.forAllMemberMappings.length > 0) {
                (_a = mapping.forAllMemberMappings).push.apply(_a, profileMapping.forAllMemberMappings);
            }
            // overwrite original type converter function
            if (profileMapping.typeConverterFunction) {
                mapping.typeConverterFunction = profileMapping.typeConverterFunction;
                mapping.mapItemFunction = profileMapping.mapItemFunction;
            }
            // overwrite original type converter function
            if (profileMapping.destinationTypeClass) {
                mapping.destinationTypeClass = profileMapping.destinationTypeClass;
            }
            // walk through all the profile's property mappings
            for (var _i = 0, _b = profileMapping.properties; _i < _b.length; _i++) {
                var property = _b[_i];
                // TODO Awkward way of locating sourceMapping ;) ...
                var sourceMapping = this.getDestinationProperty(property.destinationPropertyName, property).sourceMapping;
                if (!this.mergeSourceProperty(property, mapping.properties, sourceMapping)) {
                    mapping.properties.push(property);
                }
            }
            var _a;
        };
        AutoMapper.prototype.mapInternal = function (mapping, sourceObject) {
            if (sourceObject === null || typeof sourceObject === 'undefined') {
                return sourceObject;
            }
            if (mapping.async) {
                throw new Error('Impossible to use asynchronous mapping using automapper.map(); use automapper.mapAsync() instead.');
            }
            if (_super.prototype.isArray.call(this, sourceObject)) {
                return this.mapArray(mapping, sourceObject);
            }
            return mapping.mapItemFunction(mapping, sourceObject, _super.prototype.createDestinationObject.call(this, mapping.destinationTypeClass));
        };
        AutoMapper.prototype.mapArray = function (mapping, sourceArray) {
            var destinationArray = _super.prototype.handleArray.call(this, mapping, sourceArray, function (sourceObject, destinationObject) {
                mapping.mapItemFunction(mapping, sourceObject, destinationObject);
            });
            return destinationArray;
        };
        AutoMapper.prototype.mapItem = function (mapping, sourceObject, destinationObject) {
            var _this = this;
            destinationObject = _super.prototype.handleItem.call(this, mapping, sourceObject, destinationObject, function (propertyName) {
                _this.mapProperty(mapping, sourceObject, destinationObject, propertyName);
            });
            return destinationObject;
        };
        AutoMapper.prototype.mapItemUsingTypeConverter = function (mapping, sourceObject, destinationObject, arrayIndex) {
            var resolutionContext = {
                sourceValue: sourceObject,
                destinationValue: destinationObject
            };
            return mapping.typeConverterFunction(resolutionContext);
        };
        AutoMapper.prototype.mapProperty = function (mapping, sourceObject, destinationObject, sourceProperty) {
            var _this = this;
            _super.prototype.handleProperty.call(this, mapping, sourceObject, sourceProperty, destinationObject, function (destinationProperty, options) {
                return _this.transform(mapping, sourceObject, destinationProperty, destinationObject, options);
            });
        };
        AutoMapper.prototype.transform = function (mapping, sourceObject, destinationProperty, destinationObject, options) {
            var childDestinationProperty = destinationProperty.child;
            if (childDestinationProperty) {
                var childDestinationObject = destinationObject[destinationProperty.name];
                if (!childDestinationObject) {
                    // no child source object? create.
                    childDestinationObject = {};
                }
                // transform child by recursively calling the transform function.
                var transformed = this.transform(mapping, sourceObject, childDestinationProperty, childDestinationObject, options /*, callback*/);
                if (transformed) {
                    // only set child destination object when transformation has been successful.
                    destinationObject[destinationProperty.name] = childDestinationObject;
                }
                return transformed;
            }
            if (!_super.prototype.shouldProcessDestination.call(this, destinationProperty, sourceObject)) {
                return false;
            }
            // actually transform destination property.
            for (var _i = 0, _a = destinationProperty.transformations; _i < _a.length; _i++) {
                var transformation = _a[_i];
                if (!this.processTransformation(destinationProperty, transformation, options)) {
                    return false;
                }
            }
            _super.prototype.setPropertyValue.call(this, mapping, destinationProperty, destinationObject, options.intermediatePropertyValue);
            return true;
        };
        AutoMapper.prototype.processTransformation = function (property, transformation, options) {
            switch (transformation.transformationType) {
                case AutoMapperJs.DestinationTransformationType.Constant:
                    options.intermediatePropertyValue = transformation.constant;
                    return true;
                case AutoMapperJs.DestinationTransformationType.MemberOptions: {
                    var result = transformation.memberConfigurationOptionsFunc(options);
                    if (typeof result !== 'undefined') {
                        options.intermediatePropertyValue = result;
                    }
                    else if (!options.sourceObject) {
                        return false;
                    }
                    return true;
                }
                case AutoMapperJs.DestinationTransformationType.SourceMemberOptions: {
                    var result = transformation.sourceMemberConfigurationOptionsFunc(options);
                    if (typeof result !== 'undefined') {
                        options.intermediatePropertyValue = result;
                    }
                    else if (!options.sourceObject) {
                        return false;
                    }
                    return true;
                }
                default:
                    // this.throwMappingException(property, `AutoMapper.handlePropertyMappings: Unexpected transformation type ${transformation.transformationType}`);
                    return false;
            }
        };
        AutoMapper.prototype.createMappingObjectForGivenKeys = function (srcKeyOrType, dstKeyOrType) {
            var _this = this;
            var mapping = {
                sourceKey: _super.prototype.getKey.call(this, srcKeyOrType),
                destinationKey: _super.prototype.getKey.call(this, dstKeyOrType),
                forAllMemberMappings: new Array(),
                properties: [],
                typeConverterFunction: undefined,
                mapItemFunction: function (m, srcObj, dstObj) { return _this.mapItem(m, srcObj, dstObj); },
                sourceTypeClass: (typeof srcKeyOrType === 'string' ? undefined : srcKeyOrType),
                destinationTypeClass: (typeof dstKeyOrType === 'string' ? undefined : dstKeyOrType),
                profile: undefined,
                async: false
            };
            this._mappings[mapping.sourceKey + mapping.destinationKey] = mapping;
            return mapping;
        };
        AutoMapper.prototype.createMapGetFluentApiFunctions = function (mapping) {
            var _this = this;
            // create a fluent interface / method chaining (e.g. automapper.createMap().forMember().forMember() ...)
            var fluentFunc = {
                forMember: function (prop, valFunc) {
                    return _this.createMapForMember({ mapping: mapping, propertyName: prop, transformation: valFunc, sourceMapping: false, fluentFunctions: fluentFunc });
                },
                forSourceMember: function (prop, cfgFunc) {
                    return _this.createMapForMember({ mapping: mapping, propertyName: prop, transformation: cfgFunc, sourceMapping: true, fluentFunctions: fluentFunc });
                },
                forAllMembers: function (func) {
                    return _this.createMapForAllMembers(mapping, fluentFunc, func);
                },
                ignoreAllNonExisting: function () { return _this.createMapIgnoreAllNonExisting(mapping, fluentFunc); },
                convertToType: function (type) { return _this.createMapConvertToType(mapping, fluentFunc, type); },
                convertUsing: function (tcClassOrFunc) {
                    return _this.createMapConvertUsing(mapping, tcClassOrFunc);
                },
                withProfile: function (profile) { return _this.createMapWithProfile(mapping, profile); }
            };
            return fluentFunc;
        };
        AutoMapper.prototype.createMapForMember = function (parameters) {
            var mapping = parameters.mapping, propertyName = parameters.propertyName, transformation = parameters.transformation, sourceMapping = parameters.sourceMapping, fluentFunctions = parameters.fluentFunctions;
            // extract source/destination property names
            var metadata = AutoMapperJs.AutoMapperHelper.getMappingMetadataFromTransformationFunction(propertyName, transformation, sourceMapping);
            this.validateForMemberParameters(metadata);
            var source = metadata.source, destination = metadata.destination;
            // create property (regardless of current existance)
            var property = this.createSourceProperty(metadata, null);
            // merge with existing property or add property
            if (!this.mergeSourceProperty(property, mapping.properties, sourceMapping)) {
                mapping.properties.push(property);
            }
            if (metadata.async) {
                this._asyncMapper.createMapForMember(mapping, this.findProperty(property.name, mapping.properties));
            }
            return fluentFunctions;
        };
        AutoMapper.prototype.validateForMemberParameters = function (metadata) {
            if (!metadata.sourceMapping) {
                return;
            }
            // validate forSourceMember parameters
            if (metadata.transformation.transformationType === AutoMapperJs.DestinationTransformationType.Constant) {
                throw new Error('Configuration of forSourceMember has to be a function with one (sync) or two (async) options parameters.');
            }
        };
        AutoMapper.prototype.createSourceProperty = function (metadata, parent) {
            var level = !parent ? 0 : parent.level + 1;
            var sourceNameParts = metadata.source.split('.');
            var source = {
                name: sourceNameParts[level],
                sourcePropertyName: metadata.source,
                destinationPropertyName: metadata.destination,
                parent: parent,
                level: level,
                children: [],
                destination: null
            };
            if ((level + 1) < sourceNameParts.length) {
                // recursively add child source properties ...
                var child = this.createSourceProperty(metadata, source);
                if (child) {
                    source.children.push(child);
                }
                source.destination = null;
            }
            else {
                // ... or (!) add destination
                source.destination = this.createDestinationProperty(metadata, null);
            }
            return source;
        };
        AutoMapper.prototype.createDestinationProperty = function (metadata, parent) {
            var level = !parent ? 0 : parent.level + 1;
            var destinationNameParts = metadata.destination.split('.');
            var destination = {
                name: destinationNameParts[level],
                sourcePropertyName: metadata.source,
                destinationPropertyName: metadata.destination,
                parent: parent,
                level: level,
                child: null,
                transformations: [],
                conditionFunction: null,
                ignore: false,
                sourceMapping: false
            };
            if ((level + 1) < destinationNameParts.length) {
                // recursively add child destination properties
                destination.child = this.createDestinationProperty(metadata, destination);
            }
            else {
                // add/merge properties
                destination.sourceMapping = metadata.sourceMapping;
                destination.conditionFunction = metadata.condition;
                destination.ignore = metadata.ignore;
                destination.transformations.push(metadata.transformation);
            }
            return destination;
        };
        AutoMapper.prototype.mergeSourceProperty = function (property, existingProperties, sourceMapping) {
            // find source property
            var existing = sourceMapping
                ? this.findProperty(property.name, existingProperties)
                : this.matchSourcePropertyByDestination(property, existingProperties);
            if (!existing) {
                return false;
            }
            if (property.destination) {
                if (existing.children.length > 0) {
                    var existingDestination = this.getDestinationProperty(existing.destinationPropertyName, existing);
                    // existing is (further) nested => rebase and/or merge
                    if (this.handleMapFromProperties(property, existing)) {
                        // merge and rebase existing destination to current source level
                        if (!this.mergeDestinationProperty(property.destination, existingDestination)) {
                            return false;
                        }
                        existing.destination = existingDestination;
                        existing.children = [];
                        return true;
                    }
                    // merge property.destination with existing mapFrom() destination (don't care about nesting depth here)
                    return this.mergeDestinationProperty(property.destination, existingDestination);
                }
                // both are at same level => simple merge.
                if (!this.mergeDestinationProperty(property.destination, existing.destination)) {
                    return false;
                }
                this.handleMapFromProperties(property, existing);
                return true;
            }
            // new source is (further) nested (has children).
            if (existing.children.length > 0) {
                // both have further nesting, delegate merging child(ren) by recursively calling this function.
                for (var _i = 0, _a = property.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    if (!this.mergeSourceProperty(child, existing.children, sourceMapping)) {
                        return false;
                    }
                }
                if (property.destinationPropertyName !== property.sourcePropertyName) {
                    // this is a mapFrom() registration. It is handled using the nested source properties,
                    // we only are responsible for syncing the name properties.
                    existing.name = property.name;
                    existing.sourcePropertyName = property.sourcePropertyName;
                }
                return true;
            }
            // existing is not (further) nested. this is always a mapFrom() situation.
            // if (property.sourcePropertyName !== existing.sourcePropertyName) {
            var newDestination = this.getDestinationProperty(existing.destinationPropertyName, property);
            if (property.destinationPropertyName !== property.sourcePropertyName) {
                // this is a mapFrom() registration. In that case:
                // 1) merge destinations, 2) add source child and 3) move destination to (youngest) child
                // NOTE special mergeDestinationProperty call => we use the new destination as 'target',
                //      because that will save us trouble overwriting ;)...
                if (!this.mergeDestinationProperty(existing.destination, newDestination, true)) {
                    return false;
                }
                existing.children = property.children;
                existing.name = property.name;
                existing.sourcePropertyName = property.sourcePropertyName;
                existing.destination = null;
                // TODO Should never be necessary (test): existing.destinationPropertyName = property.destinationPropertyName;
                return true;
            }
            // ... nope, it is a destination which has previously been registered using mapFrom. just merge
            return this.mergeDestinationProperty(newDestination, existing.destination);
            // }
        };
        /**
         * handle property naming when the current property to merge is a mapFrom property
         */
        AutoMapper.prototype.handleMapFromProperties = function (property, existingProperty) {
            if (property.destinationPropertyName === property.sourcePropertyName ||
                property.sourcePropertyName === existingProperty.sourcePropertyName) {
                return false;
            }
            // only overwrite name when a mapFrom situation applies
            existingProperty.name = property.name;
            existingProperty.sourcePropertyName = property.sourcePropertyName;
            // TODO Should never be necessary (test) => existingProperty.destinationPropertyName = property.destinationPropertyName;
            return true;
        };
        AutoMapper.prototype.getDestinationProperty = function (destinationPropertyName, existingSource) {
            if (existingSource.destination) {
                return existingSource.destination;
            }
            for (var _i = 0, _a = existingSource.children; _i < _a.length; _i++) {
                var child = _a[_i];
                var destination = this.getDestinationProperty(destinationPropertyName, child);
                if (destination) {
                    return destination;
                }
            }
            return null;
        };
        AutoMapper.prototype.mergeDestinationProperty = function (destination, existingDestination, swapTransformations) {
            if (swapTransformations === void 0) { swapTransformations = false; }
            if (destination.child) {
                if (existingDestination.child) {
                    // both have further nesting, delegate merging children by recursively calling this function.
                    if (!this.mergeDestinationProperty(destination.child, existingDestination.child, swapTransformations)) {
                        return false;
                    }
                    this.handleMapFromProperties(destination, existingDestination);
                    return true;
                }
                // the current destination is not (further) nested. a destination property registration has one of both:
                // a) children or b) transformations. returning false will cause creating a duplicate source property entry instead.
                return false;
            }
            if (existingDestination.sourceMapping !== destination.sourceMapping &&
                existingDestination.sourcePropertyName !== destination.sourcePropertyName) {
                // unable to perform mapFrom() on a property which is being registered using forSourceMember.
                return false; // TODO: Unpredictable? Idea: throw new Error('Unable to perform mapFrom() on a property which is being registered using forSourceMember.');
            }
            // merge destination properties
            if (destination.sourceMapping) {
                // only set source mapping when not yet set to true, once source mapped is source mapped forever.
                // TODO Verify edge cases!
                existingDestination.sourceMapping = destination.sourceMapping;
            }
            if (destination.ignore) {
                // only set ignore when not yet set, once ignored is ignored forever.
                existingDestination.ignore = destination.ignore;
            }
            if (destination.conditionFunction) {
                // overwrite condition function by the latest one specified.
                existingDestination.conditionFunction = destination.conditionFunction;
            }
            var transformations = [];
            if (swapTransformations) {
                for (var _i = 0, _a = destination.transformations; _i < _a.length; _i++) {
                    var transformation = _a[_i];
                    transformations.push(transformation);
                }
                for (var _b = 0, _c = existingDestination.transformations; _b < _c.length; _b++) {
                    var transformation = _c[_b];
                    transformations.push(transformation);
                }
            }
            else {
                for (var _d = 0, _e = existingDestination.transformations; _d < _e.length; _d++) {
                    var transformation = _e[_d];
                    transformations.push(transformation);
                }
                for (var _f = 0, _g = destination.transformations; _f < _g.length; _f++) {
                    var transformation = _g[_f];
                    transformations.push(transformation);
                }
            }
            existingDestination.transformations = transformations;
            this.handleMapFromProperties(destination, existingDestination);
            return true;
        };
        AutoMapper.prototype.matchSourcePropertyByDestination = function (source, properties) {
            if (!properties) {
                return null;
            }
            for (var _i = 0, properties_1 = properties; _i < properties_1.length; _i++) {
                var property = properties_1[_i];
                if (property.destinationPropertyName === source.destinationPropertyName) {
                    return property;
                }
            }
            return null;
        };
        AutoMapper.prototype.findProperty = function (name, properties) {
            if (!properties) {
                return null;
            }
            for (var _i = 0, properties_2 = properties; _i < properties_2.length; _i++) {
                var property = properties_2[_i];
                if (property.name === name) {
                    return property;
                }
            }
            return null;
        };
        return AutoMapper;
    }(AutoMapperJs.AutoMapperBase));
    AutoMapper._instance = new AutoMapper();
    AutoMapperJs.AutoMapper = AutoMapper;
})(AutoMapperJs || (AutoMapperJs = {}));
// Add AutoMapper to the application's global scope. Of course, you could still use Core.AutoMapper.getInstance() as well.
var automapper = (function (app) {
    app.automapper = AutoMapperJs.AutoMapper.getInstance();
    return app.automapper;
})(this);

//# sourceMappingURL=AutoMapper.js.map

/// <reference path="../../dist/automapper-interfaces.d.ts" />
/// <reference path="../../src/ts/AutoMapper.ts" />
var AutoMapperJs;
(function (AutoMapperJs) {
    'use strict';
    /**
     * Converts source type to destination type instead of normal member mapping
     */
    var Profile = (function () {
        function Profile() {
        }
        /**
         * Implement this method in a derived class and call the CreateMap method to associate that map with this profile.
         * Avoid calling the AutoMapper class / automapper instance from this method.
         */
        Profile.prototype.configure = function () {
            // do nothing
        };
        /**
         * Create a mapping profile.
         * @param {string} sourceKey The map source key.
         * @param {string} destinationKey The map destination key.
         * @returns {Core.ICreateMapFluentFunctions}
         */
        Profile.prototype.createMap = function (sourceKey, destinationKey) {
            var argsCopy = Array.prototype.slice.apply(arguments);
            for (var index = 0, length = argsCopy.length; index < length; index++) {
                if (argsCopy[index]) {
                    // prefix sourceKey and destinationKey with 'profileName=>'
                    argsCopy[index] = this.profileName + "=>" + argsCopy[index];
                }
            }
            // pass through using arguments to keep createMap's currying support fully functional.
            return automapper.createMap.apply(automapper, argsCopy);
        };
        return Profile;
    }());
    AutoMapperJs.Profile = Profile;
})(AutoMapperJs || (AutoMapperJs = {}));

//# sourceMappingURL=Profile.js.map

/// <reference path="../../dist/automapper-interfaces.d.ts" />
var AutoMapperJs;
(function (AutoMapperJs) {
    'use strict';
    /**
     * Converts source type to destination type instead of normal member mapping
     */
    var TypeConverter = (function () {
        function TypeConverter() {
        }
        /**
         * Performs conversion from source to destination type.
         * @param {IResolutionContext} resolutionContext Resolution context.
         * @returns {any} Destination object.
         */
        TypeConverter.prototype.convert = function (resolutionContext) {
            // NOTE BL Unfortunately, TypeScript/JavaScript do not support abstract base classes.
            //         This is just one way around, please convince me about a better solution.
            throw new Error('The TypeConverter.convert method is abstract. Use a TypeConverter extension class instead.');
        };
        return TypeConverter;
    }());
    AutoMapperJs.TypeConverter = TypeConverter;
})(AutoMapperJs || (AutoMapperJs = {}));

//# sourceMappingURL=TypeConverter.js.map

/// <reference path="../../../dist/automapper-interfaces.d.ts" />
var AutoMapperJs;
(function (AutoMapperJs) {
    'use strict';
    var CamelCaseNamingConvention = (function () {
        function CamelCaseNamingConvention() {
            this.splittingExpression = /(^[a-z]+(?=$|[A-Z]{1}[a-z0-9]+)|[A-Z]?[a-z0-9]+)/;
            this.separatorCharacter = '';
        }
        CamelCaseNamingConvention.prototype.transformPropertyName = function (sourcePropertyNameParts) {
            // Transform the splitted parts.
            var result = '';
            for (var index = 0, length = sourcePropertyNameParts.length; index < length; index++) {
                if (index === 0) {
                    result += sourcePropertyNameParts[index].charAt(0).toLowerCase() +
                        sourcePropertyNameParts[index].substr(1);
                }
                else {
                    result += sourcePropertyNameParts[index].charAt(0).toUpperCase() +
                        sourcePropertyNameParts[index].substr(1);
                }
            }
            return result;
        };
        return CamelCaseNamingConvention;
    }());
    AutoMapperJs.CamelCaseNamingConvention = CamelCaseNamingConvention;
})(AutoMapperJs || (AutoMapperJs = {}));

//# sourceMappingURL=CamelCaseNamingConvention.js.map

/// <reference path="../../../dist/automapper-interfaces.d.ts" />
var AutoMapperJs;
(function (AutoMapperJs) {
    'use strict';
    var PascalCaseNamingConvention = (function () {
        function PascalCaseNamingConvention() {
            this.splittingExpression = /(^[A-Z]+(?=$|[A-Z]{1}[a-z0-9]+)|[A-Z]?[a-z0-9]+)/;
            this.separatorCharacter = '';
        }
        PascalCaseNamingConvention.prototype.transformPropertyName = function (sourcePropertyNameParts) {
            // Transform the splitted parts.
            var result = '';
            for (var index = 0, length = sourcePropertyNameParts.length; index < length; index++) {
                result += sourcePropertyNameParts[index].charAt(0).toUpperCase() +
                    sourcePropertyNameParts[index].substr(1);
                //if (index < (length - 1)) {
                //    this.separatorCharacter;
                //}
            }
            return result;
        };
        return PascalCaseNamingConvention;
    }());
    AutoMapperJs.PascalCaseNamingConvention = PascalCaseNamingConvention;
})(AutoMapperJs || (AutoMapperJs = {}));

//# sourceMappingURL=PascalCaseNamingConvention.js.map

return automapper;
}));

//# sourceMappingURL=automapper.js.map
