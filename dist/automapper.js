/*!
 * TypeScript / Javascript AutoMapper Library v1.7.0
 * https://github.com/loedeman/AutoMapper
 *
 * Copyright 2015 Bert Loedeman and other contributors
 * Released under the MIT license
 *
 * Date: 2016-06-08T16:00:00.000Z
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
                    if (str.charAt(0) === '[') {
                        // executed if the return of object.constructor.toString() is "[object objectClass]"
                        var arr = str.match(/\[\w+\s*(\w+)\]/);
                    }
                    else {
                        // executed if the return of object.constructor.toString() is "function objectClass () {}"
                        // (IE and Firefox)
                        var arr = str.match(/function\s*(\w+)/);
                    }
                    if (arr && arr.length === 2) {
                        return arr[1];
                    }
                }
            }
            throw new Error("Unable to extract class name from type '" + classType + "'");
        };
        AutoMapperHelper.getFunctionParameters = function (func) {
            var stripComments = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
            var argumentNames = /([^\s,]+)/g;
            var functionString = func.toString().replace(stripComments, '');
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
        AutoMapperHelper.getMappingMetadataFromConfigFunction = function (destination, func, sourceMapping) {
            if (typeof func !== 'function') {
                return {
                    destination: destination,
                    source: destination,
                    sourceMapping: sourceMapping,
                    condition: null,
                    ignore: false,
                    async: false
                };
            }
            var funcStr = func.toString();
            var parameterNames = AutoMapperHelper.getFunctionParameters(func);
            var optsParamName = parameterNames.length >= 1 ? parameterNames[0] : '';
            var source = sourceMapping
                ? destination
                : AutoMapperHelper.getMapFromString(funcStr, destination, optsParamName);
            var metadata = {
                destination: destination,
                source: source,
                sourceMapping: sourceMapping,
                condition: null,
                ignore: AutoMapperHelper.getIgnoreFromString(funcStr, destination),
                async: parameterNames.length === 2
            };
            // calling the member options function when used asynchronous would be too 'dangerous'.
            if (!metadata.async && AutoMapperHelper.getFunctionCallIndex(funcStr, 'condition', optsParamName) >= 0) {
                metadata.condition = AutoMapperHelper.getConditionFromFunction(func, source);
            }
            return metadata;
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
                this.setChildPropertyValues(destinationObject, destinationProperty, destinationPropertyValue);
            }
            else {
                destinationObject[destinationProperty.name] = destinationPropertyValue;
            }
        };
        AutoMapperBase.prototype.setChildPropertyValues = function (destinationObject, destinationProperty, destinationPropertyValue) {
            var dstObj;
            if (destinationObject.hasOwnProperty(destinationProperty.name) && destinationObject[destinationProperty.name]) {
                dstObj = destinationObject[destinationProperty.name];
            }
            else {
                destinationObject[destinationProperty.name] = dstObj = {};
            }
            for (var index = 0, count = destinationProperty.children.length; index < count; index++) {
                this.setNestedPropertyValue(dstObj, destinationProperty.children[index], destinationPropertyValue);
            }
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
            // use profile mapping when specified; otherwise, specify source property name as destination property name.
            var destinationPropertyName = this.getDestinationPropertyName(mapping.profile, sourcePropertyName);
            var destinationPropertyValue = sourceObject ? sourceObject[sourcePropertyName] : null;
            this.setPropertyValueByName(mapping, destinationObject, destinationPropertyName, destinationPropertyValue);
            if (autoMappingCallbackFunction) {
                autoMappingCallbackFunction(destinationPropertyValue);
            }
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

/// <reference path="../../dist/automapper-interfaces.d.ts" />
/// <reference path="AutoMapper.ts" />
/// <reference path="TypeConverter.ts" />
/// <reference path="AutoMapperHelper.ts" />
/// <reference path="AutoMapperValidator.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var AutoMapperJs;
(function (AutoMapperJs) {
    'use strict';
    /**
     * AsyncAutoMapper implementation, for asynchronous mapping support when using AutoMapper.
     */
    var AsyncAutoMapper = (function (_super) {
        __extends(AsyncAutoMapper, _super);
        function AsyncAutoMapper() {
            _super.call(this);
            AsyncAutoMapper.asyncInstance = this;
        }
        AsyncAutoMapper.prototype.createMapForMember = function (property, func, metadata) {
            var _this = this;
            var mapping = property.metadata.mapping;
            mapping.async = true;
            mapping.mapItemFunction = function (m, srcObj, dstObj, cb) { return _this.mapItem(m, srcObj, dstObj, cb); };
            property.async = true;
            property.conversionValuesAndFunctions.push(func);
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
            _super.prototype.handleProperty.call(this, mapping, sourceObject, sourceProperty, destinationObject, function (destinations, valuesAndFunctions, opts) {
                _this.handlePropertyMappings(valuesAndFunctions, opts, function (destinationPropertyValue) {
                    for (var _i = 0, destinations_1 = destinations; _i < destinations_1.length; _i++) {
                        var destination = destinations_1[_i];
                        _super.prototype.setPropertyValue.call(_this, mapping, destinationObject, destination, destinationPropertyValue);
                    }
                    callback(destinationPropertyValue);
                });
            }, function (destinationPropertyValue) {
                callback(destinationPropertyValue);
            });
        };
        AsyncAutoMapper.prototype.handlePropertyMappings = function (valuesAndFunctions, opts, callback) {
            var _this = this;
            if (!valuesAndFunctions || valuesAndFunctions.length === 0) {
                callback(opts.intermediatePropertyValue);
                return;
            }
            var valueOrFunction = valuesAndFunctions[0];
            if (typeof valueOrFunction === 'function') {
                this.handlePropertyMappingFunction(valueOrFunction, opts, function (result) {
                    if (typeof result !== 'undefined') {
                        opts.intermediatePropertyValue = result;
                        // recursively walk values/functions
                        _this.handlePropertyMappings(valuesAndFunctions.slice(1), opts, callback);
                    }
                });
            }
            else {
                // valueOrFunction is a value
                opts.intermediatePropertyValue = valueOrFunction;
                // recursively walk values/functions
                this.handlePropertyMappings(valuesAndFunctions.slice(1), opts, callback);
            }
        };
        AsyncAutoMapper.prototype.handlePropertyMappingFunction = function (func, opts, callback) {
            // check if function is asynchronous
            var args = AutoMapperJs.AutoMapperHelper.getFunctionParameters(func);
            if (args.length === 2) {
                func(opts, callback);
                return;
            }
            callback(func(opts));
        };
        AsyncAutoMapper.asyncInstance = new AsyncAutoMapper();
        return AsyncAutoMapper;
    }(AutoMapperJs.AutoMapperBase));
    AutoMapperJs.AsyncAutoMapper = AsyncAutoMapper;
})(AutoMapperJs || (AutoMapperJs = {}));

//# sourceMappingURL=AsyncAutoMapper.js.map

/// <reference path="../../dist/automapper-interfaces.d.ts" />
/// <reference path="AutoMapperBase.ts" />
/// <reference path="AsyncAutoMapper.ts" />
/// <reference path="TypeConverter.ts" />
/// <reference path="AutoMapperHelper.ts" />
/// <reference path="AutoMapperValidator.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
            _super.call(this);
            if (AutoMapper._instance) {
                return AutoMapper._instance;
            }
            else {
                AutoMapper._instance = this;
                this._profiles = {};
                this._mappings = {};
                this._asyncMapper = new AutoMapperJs.AsyncAutoMapper();
            }
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
        AutoMapper.prototype.createMapForMember = function (parameters) {
            var mapping = parameters.mapping, destinationProperty = parameters.destinationProperty, conversionValueOrFunction = parameters.conversionValueOrFunction, sourceMapping = parameters.sourceMapping, fluentFunctions = parameters.fluentFunctions;
            var metadata = AutoMapperJs.AutoMapperHelper.getMappingMetadataFromConfigFunction(destinationProperty, conversionValueOrFunction, sourceMapping);
            var property;
            if (!sourceMapping) {
                property = this.getPropertyByDestinationProperty(mapping.properties, destinationProperty);
                if (!property) {
                    property = this.getOrCreateProperty({
                        propertyNameParts: metadata.source.split('.'),
                        mapping: mapping,
                        propertyArray: mapping.properties,
                        parent: null,
                        destination: destinationProperty,
                        sourceMapping: sourceMapping
                    });
                }
            }
            else {
                property = this.getOrCreateProperty({
                    propertyNameParts: metadata.source.split('.'),
                    mapping: mapping,
                    propertyArray: mapping.properties,
                    parent: null,
                    destination: destinationProperty,
                    sourceMapping: sourceMapping
                });
            }
            if (metadata.async) {
                this.createMapForMemberAsync(property, conversionValueOrFunction, metadata);
            }
            else {
                this.createMapForMemberSync(property, conversionValueOrFunction, metadata);
            }
            return fluentFunctions;
        };
        AutoMapper.prototype.createMapForMemberAsync = function (property, valueOrFunction, metadata) {
            if (this.createMapForMemberHandleIgnore(property, metadata)) {
                return;
            }
            this._asyncMapper.createMapForMember(property, valueOrFunction, metadata);
        };
        AutoMapper.prototype.createMapForMemberSync = function (property, valueOrFunction, metadata) {
            if (this.createMapForMemberHandleIgnore(property, metadata)) {
                return;
            }
            this.createMapForMemberHandleMapFrom(property, metadata);
            property.conditionFunction = metadata.condition;
            property.conversionValuesAndFunctions.push(valueOrFunction);
        };
        AutoMapper.prototype.createMapForMemberHandleMapFrom = function (property, metadata) {
            if (metadata.source === metadata.destination) {
                return;
            }
            var _a = property.metadata, mapping = _a.mapping, root = _a.root;
            var sourceNameParts = metadata.source.split('.');
            if (sourceNameParts.length === property.level) {
                this.updatePropertyName(sourceNameParts, property);
            }
            else {
                // check if only one destination on property root. in that case, rebase property and overwrite root.
                if (root.metadata.destinationCount === 1) {
                    var propertyRootIndex = mapping.properties.indexOf(root);
                    mapping.properties[propertyRootIndex] = undefined;
                    var propArray = [];
                    var newProperty = this.getOrCreateProperty({
                        propertyNameParts: metadata.source.split('.'),
                        mapping: mapping,
                        propertyArray: propArray,
                        parent: null,
                        destination: metadata.destination,
                        sourceMapping: metadata.sourceMapping
                    });
                    newProperty.conditionFunction = property.conditionFunction;
                    newProperty.conversionValuesAndFunctions = property.conversionValuesAndFunctions;
                    mapping.properties[propertyRootIndex] = propArray[0];
                }
                else {
                    throw new Error('Rebasing properties with multiple destinations is not yet implemented.');
                }
            }
        };
        AutoMapper.prototype.updatePropertyName = function (sourceNameParts, property) {
            property.name = sourceNameParts[sourceNameParts.length - 1];
            if (sourceNameParts.length === 1) {
                return;
            }
            this.updatePropertyName(sourceNameParts.splice(0, 1), property.metadata.parent);
        };
        AutoMapper.prototype.createMapForMemberHandleIgnore = function (property, metadata) {
            if (property.ignore || metadata.ignore) {
                // source name will always be destination name when ignoring.
                property.name = metadata.destination;
                property.ignore = true;
                property.async = false;
                property.destinations = null;
                property.conversionValuesAndFunctions = [];
                return true;
            }
            return false;
        };
        AutoMapper.prototype.getPropertyByDestinationProperty = function (properties, destinationPropertyName) {
            if (properties === null || properties === undefined) {
                return null;
            }
            for (var _i = 0, properties_1 = properties; _i < properties_1.length; _i++) {
                var srcProp = properties_1[_i];
                if (srcProp.metadata.destinations !== null && srcProp.metadata.destinations !== undefined) {
                    for (var destination in srcProp.metadata.destinations) {
                        if (destination === destinationPropertyName) {
                            return srcProp.metadata.destinations[destination].source;
                        }
                    }
                }
                var childProp = this.getPropertyByDestinationProperty(srcProp.children, destinationPropertyName);
                if (childProp != null) {
                    return childProp;
                }
            }
            return null;
        };
        AutoMapper.prototype.getOrCreateProperty = function (parameters) {
            var propertyNameParts = parameters.propertyNameParts, mapping = parameters.mapping, parent = parameters.parent, propertyArray = parameters.propertyArray, destination = parameters.destination, sourceMapping = parameters.sourceMapping;
            var name = propertyNameParts[0];
            var property;
            if (propertyArray) {
                for (var _i = 0, propertyArray_1 = propertyArray; _i < propertyArray_1.length; _i++) {
                    var child = propertyArray_1[_i];
                    if (child.name === name) {
                        property = child;
                        break;
                    }
                }
            }
            if (property === undefined || property === null) {
                property = this.createProperty({
                    name: name,
                    parent: parent,
                    propertyArray: propertyArray,
                    sourceMapping: sourceMapping,
                    mapping: mapping
                });
            }
            if (propertyNameParts.length === 1) {
                if (destination) {
                    var destinationTargetArray = property.destinations ? property.destinations : [];
                    var dstProp = this.getOrCreateProperty({
                        propertyNameParts: destination.split('.'),
                        mapping: mapping,
                        propertyArray: destinationTargetArray,
                        parent: null,
                        destination: null,
                        sourceMapping: sourceMapping
                    });
                    if (destinationTargetArray.length > 0) {
                        property.metadata.root.metadata.destinations[destination] = { source: property, destination: dstProp };
                        property.metadata.root.metadata.destinationCount++;
                        property.destinations = destinationTargetArray;
                    }
                }
                return property;
            }
            if (property.children === null || property.children === undefined) {
                property.children = [];
            }
            return this.getOrCreateProperty({
                propertyNameParts: propertyNameParts.slice(1),
                mapping: mapping,
                propertyArray: property.children,
                parent: property,
                destination: destination,
                sourceMapping: sourceMapping
            });
        };
        AutoMapper.prototype.createProperty = function (parameters) {
            var name = parameters.name, parent = parameters.parent, propertyArray = parameters.propertyArray, sourceMapping = parameters.sourceMapping, mapping = parameters.mapping;
            var property = {
                name: name,
                metadata: {
                    mapping: mapping,
                    root: parent ? parent.metadata.root : null,
                    parent: parent,
                    destinations: {},
                    destinationCount: 0
                },
                sourceMapping: sourceMapping,
                level: !parent ? 1 : parent.level + 1,
                ignore: false,
                async: false,
                conversionValuesAndFunctions: []
            };
            if (property.metadata.root === null) {
                property.metadata.root = property;
            }
            if (propertyArray) {
                propertyArray.push(property);
            }
            return property;
        };
        AutoMapper.prototype.createMapForSourceMember = function (mapping, fluentFunc, srcProp, cnf) {
            if (typeof cnf !== 'function') {
                throw new Error('Configuration of forSourceMember has to be a function with one (sync) or two (async) options parameters.');
            }
            return this.createMapForMember({
                mapping: mapping,
                fluentFunctions: fluentFunc,
                destinationProperty: srcProp,
                conversionValueOrFunction: cnf,
                sourceMapping: true
            });
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
            try {
                // check if sync: TypeConverter instance
                if (tcClassOrFunc instanceof AutoMapperJs.TypeConverter) {
                    this.configureSynchronousConverterFunction(mapping, tcClassOrFunc.convert);
                    return;
                }
                var functionParameters = AutoMapperJs.AutoMapperHelper.getFunctionParameters(tcClassOrFunc);
                switch (functionParameters.length) {
                    case 0:
                        // check if sync: TypeConverter class definition
                        var typeConverter;
                        try {
                            typeConverter = (new tcClassOrFunc());
                        }
                        catch (e) {
                        }
                        if (typeConverter instanceof AutoMapperJs.TypeConverter) {
                            this.configureSynchronousConverterFunction(mapping, typeConverter.convert);
                            return;
                        }
                        break;
                    case 1:
                        // sync: function with resolutionContext parameter
                        this.configureSynchronousConverterFunction(mapping, tcClassOrFunc);
                        return;
                    case 2:
                        // check if async: function with resolutionContext and callback parameters
                        this._asyncMapper.createMapConvertUsing(mapping, tcClassOrFunc);
                        return;
                }
                // okay, just try feeding the function to the configure function anyway...
                this.configureSynchronousConverterFunction(mapping, tcClassOrFunc);
            }
            catch (e) {
                throw new Error("The value provided for typeConverterClassOrFunction is invalid. " + e);
            }
            throw new Error("The value provided for typeConverterClassOrFunction is invalid.");
        };
        AutoMapper.prototype.configureSynchronousConverterFunction = function (mapping, converterFunc) {
            var _this = this;
            if (!converterFunc || AutoMapperJs.AutoMapperHelper.getFunctionParameters(converterFunc).length !== 1) {
                throw new Error('The function provided does not provide exactly one (resolutionContext) parameter.');
            }
            mapping.typeConverterFunction = converterFunc;
            mapping.mapItemFunction = function (m, srcObj, dstObj) { return _this.mapItemUsingTypeConverter(m, srcObj, dstObj); };
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
            }
            // overwrite original type converter function
            if (profileMapping.destinationTypeClass) {
                mapping.destinationTypeClass = profileMapping.destinationTypeClass;
            }
            // walk through all the profile's property mappings
            for (var _i = 0, _b = profileMapping.properties; _i < _b.length; _i++) {
                var property = _b[_i];
                this.mergeProperty(mapping, mapping.properties, property);
            }
            var _a;
        };
        AutoMapper.prototype.mergeProperty = function (mapping, properties, property) {
            var overwritten = false;
            for (var index = 0; index < mapping.properties.length; index++) {
                var existing = mapping.properties[index];
                if (existing.name === property.name) {
                    // in which case, we overwrite that one with the profile's property mapping.
                    // okay, maybe a bit rude, but real merging is pretty complex and you should
                    // probably not want to combine normal and profile createMap.forMember calls.
                    mapping.properties[index] = property;
                    overwritten = true;
                }
            }
            if (overwritten === false) {
                mapping.properties.push(property);
            }
        };
        AutoMapper.prototype.mapInternal = function (mapping, sourceObject) {
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
            _super.prototype.handleProperty.call(this, mapping, sourceObject, sourceProperty, destinationObject, function (destinations, valuesAndFunctions, opts) {
                var destinationPropertyValue = _this.handlePropertyMappings(valuesAndFunctions, opts);
                for (var _i = 0, destinations_1 = destinations; _i < destinations_1.length; _i++) {
                    var destination = destinations_1[_i];
                    _super.prototype.setPropertyValue.call(_this, mapping, destinationObject, destination, destinationPropertyValue);
                }
            });
        };
        AutoMapper.prototype.handlePropertyMappings = function (valuesAndFunctions, opts) {
            if (!valuesAndFunctions || valuesAndFunctions.length === 0) {
                return opts.intermediatePropertyValue;
            }
            var valueOrFunction = valuesAndFunctions[0];
            if (typeof valueOrFunction === 'function') {
                var result = valueOrFunction(opts);
                if (typeof result !== 'undefined') {
                    opts.intermediatePropertyValue = result;
                }
                // recursively walk values/functions
                return this.handlePropertyMappings(valuesAndFunctions.slice(1), opts);
            }
            else {
                // valueOrFunction is a value
                opts.intermediatePropertyValue = valueOrFunction;
                // recursively walk values/functions
                return this.handlePropertyMappings(valuesAndFunctions.slice(1), opts);
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
                    return _this.createMapForMember({
                        mapping: mapping,
                        fluentFunctions: fluentFunc,
                        destinationProperty: prop,
                        conversionValueOrFunction: valFunc,
                        sourceMapping: false
                    });
                },
                forSourceMember: function (prop, cfgFunc) {
                    return _this.createMapForSourceMember(mapping, fluentFunc, prop, cfgFunc);
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
        AutoMapper._instance = new AutoMapper();
        return AutoMapper;
    }(AutoMapperJs.AutoMapperBase));
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
                if (!argsCopy[index]) {
                    continue;
                }
                // prefix sourceKey and destinationKey with 'profileName=>'
                argsCopy[index] = this.profileName + "=>" + argsCopy[index];
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
