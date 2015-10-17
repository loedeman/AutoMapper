/*!
 * TypeScript / Javascript AutoMapper Library v1.5.0
 * https://github.com/ArcadyIT/AutoMapper
 *
 * Copyright 2015 Arcady BV and other contributors
 * Released under the MIT license
 *
 * Date: 2015-10-17T01:03:43.231Z
 */
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
        // TODO BL Perhaps move to separate utility class?
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
        // TODO BL Perhaps move to separate utility class?
        // TODO BL Document (src: http://www.crockford.com/javascript/www_svendtofte_com/code/curried_javascript/index.html)
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
        return AutoMapperHelper;
    })();
    AutoMapperJs.AutoMapperHelper = AutoMapperHelper;
})(AutoMapperJs || (AutoMapperJs = {}));

//# sourceMappingURL=AutoMapperHelper.js.map
/// <reference path="../../dist/arcady-automapper-interfaces.d.ts" />
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
            if (strictMode === void 0) { strictMode = true; }
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
            for (var member in mapping.forMemberMappings) {
                if (!mapping.forMemberMappings.hasOwnProperty(member)) {
                    continue;
                }
                tryHandle(AutoMapperValidator.validatePropertyMapping(mapping.forMemberMappings[member], member, srcObj, dstObj));
                validatedMembers.push(member);
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
    })();
    AutoMapperJs.AutoMapperValidator = AutoMapperValidator;
})(AutoMapperJs || (AutoMapperJs = {}));

//# sourceMappingURL=AutoMapperValidator.js.map
/// <reference path="../../dist/arcady-automapper-interfaces.d.ts" />
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
            for (var sourcePropertyName in sourceObject) {
                if (!sourceObject.hasOwnProperty(sourcePropertyName)) {
                    continue;
                }
                propertyFunction(sourcePropertyName);
            }
            return destinationObject;
        };
        AutoMapperBase.prototype.handleProperty = function (mapping, sourceObject, sourcePropertyName, destinationObject, loopMemberValuesAndFunctions) {
            var propertyMapping = mapping.forMemberMappings[sourcePropertyName];
            if (propertyMapping) {
                // a forMember mapping exists
                var ignore = propertyMapping.ignore, conditionFunction = propertyMapping.conditionFunction, destinationProperty = propertyMapping.destinationProperty, mappingValuesAndFunctions = propertyMapping.mappingValuesAndFunctions;
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
                var memberConfigurationOptions = {
                    mapFrom: function () {
                        // no action required, just here as a stub to prevent calling a non-existing 'opts.mapFrom()' function.
                    },
                    condition: function (predicate) {
                        // no action required, just here as a stub to prevent calling a non-existing 'opts.mapFrom()' function.
                    },
                    sourceObject: sourceObject,
                    sourcePropertyName: sourcePropertyName,
                    intermediatePropertyValue: sourceObject[sourcePropertyName]
                };
                loopMemberValuesAndFunctions(propertyMapping.destinationProperty, mappingValuesAndFunctions, memberConfigurationOptions);
            }
            else {
                // no forMember mapping exists, auto map properties ...
                // ... except for the situation where ignoreAllNonExisting is specified.
                if (mapping.ignoreAllNonExisting) {
                    return;
                }
                // use profile mapping when specified; otherwise, specify source property name as destination property name.
                var destinationPropertyName = this.getDestinationPropertyName(mapping.profile, sourcePropertyName);
                this.setPropertyValue(mapping, destinationObject, destinationPropertyName, sourceObject[sourcePropertyName]);
            }
        };
        AutoMapperBase.prototype.setPropertyValue = function (mapping, destinationObject, destinationProperty, destinationPropertyValue) {
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
    })();
    AutoMapperJs.AutoMapperBase = AutoMapperBase;
})(AutoMapperJs || (AutoMapperJs = {}));

//# sourceMappingURL=AutoMapperBase.js.map
/// <reference path="../../dist/arcady-automapper-interfaces.d.ts" />
/// <reference path="AutoMapper.ts" />
/// <reference path="TypeConverter.ts" />
/// <reference path="AutoMapperHelper.ts" />
/// <reference path="AutoMapperValidator.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var AutoMapperJs;
(function (AutoMapperJs) {
    'use strict';
    /**
     * AsyncAutoMapper implementation, for asynchronous mapping support when using AutoMapper.
     */
    var AsyncAutoMapper = (function (_super) {
        __extends(AsyncAutoMapper, _super);
        /**
         * Creates a new AsyncAutoMapper instance. This class is intended to be a Singleton.
         * Do not use the constructor directly from code. Use getInstance() function instead.
         * @constructor
         */
        function AsyncAutoMapper() {
            _super.call(this);
            AsyncAutoMapper.asyncInstance = this;
        }
        /**
         * Gets AutoMapper Singleton instance.
         * @returns {Core.AutoMapper}
         */
        AsyncAutoMapper.getInstance = function () {
            return AsyncAutoMapper.asyncInstance;
        };
        AsyncAutoMapper.prototype.createMapForMemberFunction = function (mapping, memberMapping, memberConfigFunc) {
            var _this = this;
            mapping.async = true;
            mapping.mapItemFunction = function (m, srcObj, dstObj, cb) { return _this.mapItem(m, srcObj, dstObj, cb); };
            memberMapping.async = true;
            memberMapping.mappingValuesAndFunctions.push(memberConfigFunc);
        };
        AsyncAutoMapper.prototype.createMapForSourceMemberFunction = function (mapping, memberMapping, memberConfigFunc) {
            var _this = this;
            mapping.async = true;
            mapping.mapItemFunction = function (m, srcObj, dstObj, cb) { return _this.mapItem(m, srcObj, dstObj, cb); };
            memberMapping.async = true;
            memberMapping.mappingValuesAndFunctions.push(memberConfigFunc);
        };
        AsyncAutoMapper.prototype.createMapConvertUsing = function (mapping, converterFunction) {
            var _this = this;
            mapping.async = true;
            mapping.typeConverterFunction = converterFunction;
            mapping.mapItemFunction = function (m, srcObj, dstObj, cb) { return _this.mapItemUsingTypeConverter(m, srcObj, dstObj, cb); };
        };
        AsyncAutoMapper.prototype.map = function (sourceKey, destinationKey, mappings, sourceObject, callback) {
            var _this = this;
            if (arguments.length === 5) {
                this.mapWithMapping(_super.prototype.getMapping.call(this, mappings, sourceKey, destinationKey), sourceObject, callback);
                return;
            }
            // provide performance optimized (preloading) currying support.
            if (arguments.length === 2) {
                return function (srcObj, callback) { return _this.mapWithMapping(_super.prototype.getMapping.call(_this, mappings, sourceKey, destinationKey), srcObj, callback); };
            }
            if (arguments.length === 1) {
                return function (dstKey, srcObj, callback) { return _this.map(sourceKey, dstKey, mappings, srcObj, callback); };
            }
            return function (srcKey, dstKey, srcObj) { return _this.map(srcKey, dstKey, mappings, srcObj, callback); };
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
                    if (callbacksToGo === 0) {
                        callback(destinationArray);
                    }
                });
            });
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
                    if (callbacksToGo === 0) {
                        callback(destinationObject);
                    }
                });
            });
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
            _super.prototype.handleProperty.call(this, mapping, sourceObject, sourceProperty, destinationObject, function (destinationProperty, valuesAndFunctions, opts) {
                _this.handlePropertyMappings(valuesAndFunctions, opts, function (destinationPropertyValue) {
                    _super.prototype.setPropertyValue.call(_this, mapping, destinationObject, destinationProperty, destinationPropertyValue);
                    callback(destinationPropertyValue);
                });
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
    })(AutoMapperJs.AutoMapperBase);
    AutoMapperJs.AsyncAutoMapper = AsyncAutoMapper;
})(AutoMapperJs || (AutoMapperJs = {}));

//# sourceMappingURL=AsyncAutoMapper.js.map
/// <reference path="../../dist/arcady-automapper-interfaces.d.ts" />
/// <reference path="AutoMapperBase.ts" />
/// <reference path="AsyncAutoMapper.ts" />
/// <reference path="TypeConverter.ts" />
/// <reference path="AutoMapperHelper.ts" />
/// <reference path="AutoMapperValidator.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var AutoMapperJs;
(function (AutoMapperJs) {
    'use strict';
    /**
     * AutoMapper implementation, for both creating maps and performing maps. Comparable usage and functionality to the original
     * .NET AutoMapper library is the pursuit of this implementation.
     */
    var AutoMapper = (function (_super) {
        __extends(AutoMapper, _super);
        /**
         * Creates a new AutoMapper instance. This class is intended to be a Singleton.
         * Do not use the constructor directly from code. Use getInstance() function instead.
         * @constructor
         */
        function AutoMapper() {
            _super.call(this);
            if (AutoMapper.instance) {
                return AutoMapper.instance;
            }
            else {
                AutoMapper.instance = this;
                this.profiles = {};
                this.mappings = {};
                this.asyncAutoMapper = new AutoMapperJs.AsyncAutoMapper();
            }
        }
        /**
         * Gets AutoMapper Singleton instance.
         * @returns {Core.AutoMapper}
         */
        AutoMapper.getInstance = function () {
            return AutoMapper.instance;
        };
        /**
         * Initializes the mapper with the supplied configuration.
         * @param {(config: IConfiguration) => void} configFunction Configuration function to call.
         */
        AutoMapper.prototype.initialize = function (configFunction) {
            var that = this;
            // NOTE BL casting to any is needed, since TS does not fully support method overloading.
            var configuration = {
                addProfile: function (profile) {
                    profile.configure();
                    that.profiles[profile.profileName] = profile;
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
         * @returns {Core.IAutoMapperCreateMapChainingFunctions}
         */
        AutoMapper.prototype.createMap = function (sourceKeyOrType, destinationKeyOrType) {
            var _this = this;
            // provide currying support.
            if (arguments.length < 2) {
                return AutoMapperJs.AutoMapperHelper.handleCurrying(this.createMap, arguments, this);
            }
            // create a mapping object for the given keys
            var mapping = {
                sourceKey: _super.prototype.getKey.call(this, sourceKeyOrType),
                destinationKey: _super.prototype.getKey.call(this, destinationKeyOrType),
                forAllMemberMappings: new Array(),
                forMemberMappings: {},
                typeConverterFunction: undefined,
                mapItemFunction: function (m, srcObj, dstObj) { return _this.mapItem(m, srcObj, dstObj); },
                sourceTypeClass: (typeof sourceKeyOrType === 'string' ? undefined : sourceKeyOrType),
                destinationTypeClass: (typeof destinationKeyOrType === 'string' ? undefined : destinationKeyOrType),
                profile: undefined,
                async: false
            };
            this.mappings[mapping.sourceKey + mapping.destinationKey] = mapping;
            // return an object with available 'sub' functions to create a fluent interface / method chaining 
            // (e.g. automapper.createMap().forMember().forMember() ...)
            var fluentApiFuncs = {
                forMember: function (destinationProperty, valueOrFunction) {
                    return _this.createMapForMember(mapping, fluentApiFuncs, destinationProperty, valueOrFunction);
                },
                forSourceMember: function (sourceProperty, configFunction) {
                    return _this.createMapForSourceMember(mapping, fluentApiFuncs, sourceProperty, configFunction);
                },
                forAllMembers: function (func) {
                    return _this.createMapForAllMembers(mapping, fluentApiFuncs, func);
                },
                ignoreAllNonExisting: function () {
                    return _this.createMapIgnoreAllNonExisting(mapping, fluentApiFuncs);
                },
                convertToType: function (typeClass) {
                    return _this.createMapConvertToType(mapping, fluentApiFuncs, typeClass);
                },
                convertUsing: function (typeConverterClassOrFunction) {
                    return _this.createMapConvertUsing(mapping, typeConverterClassOrFunction);
                },
                withProfile: function (profileName) { return _this.createMapWithProfile(mapping, profileName); }
            };
            return fluentApiFuncs;
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
                return this.mapInternal(_super.prototype.getMapping.call(this, this.mappings, sourceKeyOrType, destinationKeyOrType), sourceObject);
            }
            // provide performance optimized (preloading) currying support.
            if (arguments.length === 2) {
                return function (srcObj) { return _this.mapInternal(_super.prototype.getMapping.call(_this, _this.mappings, sourceKeyOrType, destinationKeyOrType), srcObj); };
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
            return this.asyncAutoMapper.map(sourceKeyOrType, destinationKeyOrType, this.mappings, sourceObject, callback);
        };
        /**
         * Validates mapping configuration by dry-running. Since JS does not
         * fully support typing, it only checks if properties match on both
         * sides. The function needs IMapping.sourceTypeClass and
         * IMapping.destinationTypeClass to function.
         * @param {boolean} strictMode Whether or not to fail when properties
         *                             sourceTypeClass or destinationTypeClass
         *                             are unavailable.
         */
        AutoMapper.prototype.assertConfigurationIsValid = function (strictMode) {
            if (strictMode === void 0) { strictMode = true; }
            AutoMapperJs.AutoMapperValidator.assertConfigurationIsValid(this.mappings, strictMode);
        };
        /**
         * Customize configuration for an individual destination member.
         * @param {IMapping} mapping The mapping configuration for the current mapping keys/types.
         * @param {IAutoMapperCreateMapChainingFunctions} toReturnFunctions The functions object to return to enable fluent layout behavior.
         * @param {string} destinationProperty The destination member property name.
         * @param valueOrFunction The value or function to use for this individual member.
         * @returns {Core.IAutoMapperCreateMapChainingFunctions}
         */
        AutoMapper.prototype.createMapForMember = function (mapping, toReturnFunctions, destinationProperty, valueOrFunction) {
            // find existing mapping for member
            var originalSourcePropertyName = undefined;
            var memberMapping = this.createMapForMemberFindMember(mapping, destinationProperty);
            if (memberMapping !== null && memberMapping !== undefined) {
                // do not add additional mappings to a member that is already ignored.
                if (memberMapping.ignore) {
                    return toReturnFunctions;
                }
                // store original source property name (cloned)
                originalSourcePropertyName = "" + memberMapping.sourceProperty;
            }
            else {
                // set defaults for member mapping
                memberMapping = {
                    sourceProperty: destinationProperty,
                    destinationProperty: destinationProperty,
                    sourceMapping: false,
                    mappingValuesAndFunctions: new Array(),
                    ignore: false,
                    async: false,
                    conditionFunction: undefined
                };
            }
            if (typeof valueOrFunction === 'function') {
                this.createMapForMemberHandleMappingFunction(mapping, memberMapping, valueOrFunction);
            }
            else {
                memberMapping.mappingValuesAndFunctions.push(valueOrFunction);
            }
            // if this createMapForMember operation changes the source member (e.g. when mapFrom was specified), we delete
            // the existing member mapping from the dictionary. After that, we add the merged member mapping to the dictionary
            // with the new source member as key.
            if (!originalSourcePropertyName) {
                mapping.forMemberMappings[memberMapping.sourceProperty] = memberMapping;
            }
            else if (originalSourcePropertyName !== memberMapping.sourceProperty) {
                delete mapping.forMemberMappings[originalSourcePropertyName];
                mapping.forMemberMappings[memberMapping.sourceProperty] = memberMapping;
            }
            return toReturnFunctions;
        };
        /**
         * Try to locate an existing member mapping.
         * @param {IMapping} mapping The mapping configuration for the current mapping keys/types.
         * @param {string} destinationProperty The destination member property name.
         * @returns {IForMemberMapping} Existing member mapping if found; otherwise, null.
         */
        AutoMapper.prototype.createMapForMemberFindMember = function (mapping, destinationPropertyName) {
            for (var property in mapping.forMemberMappings) {
                if (!mapping.forMemberMappings.hasOwnProperty(property)) {
                    continue;
                }
                var memberMapping = mapping.forMemberMappings[property];
                if (memberMapping.destinationProperty === destinationPropertyName) {
                    return memberMapping;
                }
            }
            return null;
        };
        AutoMapper.prototype.createMapForMemberHandleMappingFunction = function (mapping, memberMapping, memberConfigFunc) {
            var memberConfigFuncParameters = AutoMapperJs.AutoMapperHelper.getFunctionParameters(memberConfigFunc);
            if (memberConfigFuncParameters.length <= 1) {
                this.createMapForMemberHandleSyncMappingFunction(memberMapping, memberConfigFunc);
            }
            else {
                this.createMapForMemberHandleAsyncMappingFunction(mapping, memberMapping, memberConfigFunc);
            }
        };
        AutoMapper.prototype.createMapForMemberHandleSyncMappingFunction = function (memberMapping, memberConfigFunc) {
            var addMappingValueOrFunction = true;
            // Since we are calling the valueOrFunction function to determine whether to ignore or map from another property, we
            // want to prevent the call to be error prone when the end user uses the '(opts)=> opts.sourceObject.sourcePropertyName'
            // syntax. We don't actually have a source object when creating a mapping; therefore, we 'stub' a source object for the
            // function call.
            var sourceObject = {};
            sourceObject[memberMapping.sourceProperty] = {};
            // calling the function will result in calling our stubbed ignore() and mapFrom() functions if used inside the function.
            var configFuncOptions = {
                ignore: function () {
                    // an ignored member effectively has no mapping values / functions. Remove potentially existing values / functions.
                    memberMapping.ignore = true;
                    memberMapping.sourceProperty = memberMapping.destinationProperty; // in case someone really tried mapFrom before.
                    memberMapping.mappingValuesAndFunctions = new Array();
                    addMappingValueOrFunction = false;
                },
                condition: function (predicate) {
                    memberMapping.conditionFunction = predicate;
                },
                mapFrom: function (sourcePropertyName) {
                    memberMapping.sourceProperty = sourcePropertyName;
                },
                sourceObject: sourceObject,
                sourcePropertyName: memberMapping.sourceProperty,
                intermediatePropertyValue: {}
            };
            // actually call the (stubbed) member config function.
            try {
                memberConfigFunc(configFuncOptions);
            }
            catch (err) {
            }
            if (addMappingValueOrFunction) {
                memberMapping.mappingValuesAndFunctions.push(memberConfigFunc);
            }
        };
        AutoMapper.prototype.createMapForMemberHandleAsyncMappingFunction = function (mapping, memberMapping, memberConfigFunc) {
            this.asyncAutoMapper.createMapForMemberFunction(mapping, memberMapping, memberConfigFunc);
        };
        /**
         * Customize configuration for an individual source member.
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param toReturnFunctions The functions object to return to enable fluent layout behavior.
         * @param sourceProperty The source member property name.
         * @param memberConfigFunc The function to use for this individual member.
         * @returns {Core.IAutoMapperCreateMapChainingFunctions}
         */
        // TODO Refactor sync/async!
        AutoMapper.prototype.createMapForSourceMember = function (mapping, toReturnFunctions, sourceProperty, memberConfigFunc) {
            // set defaults
            var ignore = false;
            var destinationProperty = sourceProperty;
            var async = false;
            if (typeof memberConfigFunc !== 'function') {
                throw new Error('Configuration of forSourceMember has to be a function with one options parameter.');
            }
            if (AutoMapperJs.AutoMapperHelper.getFunctionParameters(memberConfigFunc).length <= 1) {
                var configFuncOptions = {
                    ignore: function () {
                        ignore = true;
                        destinationProperty = undefined;
                    }
                };
                memberConfigFunc(configFuncOptions);
            }
            else {
                async = true;
            }
            var memberMapping = mapping.forMemberMappings[sourceProperty];
            if (memberMapping) {
                if (ignore) {
                    memberMapping.ignore = true;
                    memberMapping.async = false;
                    memberMapping.mappingValuesAndFunctions = new Array();
                }
                else {
                    memberMapping.async = async;
                    memberMapping.mappingValuesAndFunctions.push(memberConfigFunc);
                }
            }
            else {
                mapping.forMemberMappings[sourceProperty] = {
                    sourceProperty: sourceProperty,
                    destinationProperty: destinationProperty,
                    sourceMapping: true,
                    mappingValuesAndFunctions: [memberConfigFunc],
                    ignore: ignore,
                    async: async,
                    conditionFunction: undefined
                };
            }
            if (async === true) {
                mapping.async = true;
            }
            return toReturnFunctions;
        };
        /**
         * Customize configuration for all destination members.
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param toReturnFunctions The functions object to return to enable fluent layout behavior.
         * @param func The function to use for this individual member.
         * @returns {Core.IAutoMapperCreateMapChainingFunctions}
         */
        AutoMapper.prototype.createMapForAllMembers = function (mapping, toReturnFunctions, func) {
            mapping.forAllMemberMappings.push(func);
            return toReturnFunctions;
        };
        /**
         * Ignore all members not specified explicitly.
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param toReturnFunctions The functions object to return to enable fluent layout behavior.
         * @returns {Core.IAutoMapperCreateMapChainingFunctions}
         */
        AutoMapper.prototype.createMapIgnoreAllNonExisting = function (mapping, toReturnFunctions) {
            mapping.ignoreAllNonExisting = true;
            return toReturnFunctions;
        };
        /**
         * Specify to which class type AutoMapper should convert. When specified, AutoMapper will create an instance of the given type, instead of returning a new object literal.
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param toReturnFunctions The functions object to return to enable fluent layout behavior.
         * @param typeClass The destination type class.
         * @returns {Core.IAutoMapperCreateMapChainingFunctions}
         */
        AutoMapper.prototype.createMapConvertToType = function (mapping, toReturnFunctions, typeClass) {
            if (mapping.destinationTypeClass) {
                if (mapping.destinationTypeClass === typeClass) {
                    return toReturnFunctions;
                }
                throw new Error('Destination type class can only be set once.');
            }
            mapping.destinationTypeClass = typeClass;
            return toReturnFunctions;
        };
        /**
         * Skip normal member mapping and convert using a custom type converter (instantiated during mapping).
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param typeConverterClassOrFunction The converter class or function to use when converting.
         */
        AutoMapper.prototype.createMapConvertUsing = function (mapping, typeConverterClassOrFunction) {
            var _this = this;
            var typeConverterFunction;
            var functionParameters = AutoMapperJs.AutoMapperHelper.getFunctionParameters(typeConverterClassOrFunction);
            // 1. check if a function with one parameter is provided; if so, assume it to be the convert function.
            // 2. check if an instance of TypeConverter is provided; in that case, there will be a convert function.
            // 3. assume we are dealing with a class definition, instantiate it and store its convert function.
            // [4. okay, really? the dev providing typeConverterClassOrFunction appears to be an idiot - fire him/her :P .]
            var async = false;
            try {
                if (typeConverterClassOrFunction instanceof AutoMapperJs.TypeConverter) {
                    typeConverterFunction = typeConverterClassOrFunction.convert;
                }
                else if (functionParameters.length === 2) {
                    async = true;
                }
                else if (functionParameters.length === 1) {
                    typeConverterFunction = typeConverterClassOrFunction;
                }
                else {
                    // ReSharper disable InconsistentNaming
                    typeConverterFunction = (new typeConverterClassOrFunction()).convert;
                }
            }
            catch (e) {
                throw new Error("The value provided for typeConverterClassOrFunction is invalid. Exception: " + e);
            }
            if (async) {
                this.asyncAutoMapper.createMapConvertUsing(mapping, typeConverterClassOrFunction);
            }
            else {
                if (!typeConverterFunction || AutoMapperJs.AutoMapperHelper.getFunctionParameters(typeConverterFunction).length !== 1) {
                    throw new Error('The value provided for typeConverterClassOrFunction is invalid, because it does not provide exactly one (resolutionContext) parameter.');
                }
                mapping.typeConverterFunction = typeConverterFunction;
                mapping.mapItemFunction = function (m, srcObj, dstObj) { return _this.mapItemUsingTypeConverter(m, srcObj, dstObj); };
            }
        };
        /**
         * Assign a profile to the current type map.
         * @param {IMapping} mapping The mapping configuration for the current mapping keys/types.
         * @param {string} profileName The profile name of the profile to assign.
         */
        AutoMapper.prototype.createMapWithProfile = function (mapping, profileName) {
            // check if given profile exists
            var profile = this.profiles[profileName];
            if (typeof profile === 'undefined' || profile.profileName !== profileName) {
                throw new Error("Could not find profile with profile name '" + profileName + "'.");
            }
            mapping.profile = profile;
            // merge mappings
            this.createMapWithProfileMergeMappings(mapping, profileName);
        };
        /**
         * Merge original mapping object with the assigned profile's mapping object.
         * @param {IMapping} mapping The mapping configuration for the current mapping keys/types.
         * @param {string} profileName The profile name of the profile to assign.
         */
        AutoMapper.prototype.createMapWithProfileMergeMappings = function (mapping, profileName) {
            var profileMappingKey = profileName + "=>" + mapping.sourceKey + profileName + "=>" + mapping.destinationKey;
            var profileMapping = this.mappings[profileMappingKey];
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
            for (var propertyName in profileMapping.forMemberMappings) {
                if (!profileMapping.forMemberMappings.hasOwnProperty(propertyName)) {
                    continue;
                }
                var profilePropertyMapping = profileMapping.forMemberMappings[propertyName];
                // try to find an existing mapping for this property mapping
                var existingPropertyMapping = this.createMapForMemberFindMember(mapping, profilePropertyMapping.destinationProperty);
                if (existingPropertyMapping) {
                    // in which case, we overwrite that one with the profile's property mapping.
                    // okay, maybe a bit rude, but real merging is pretty complex and you should
                    // probably not want to combine normal and profile createMap.forMember calls.
                    delete mapping.forMemberMappings[existingPropertyMapping.sourceProperty];
                    mapping.forMemberMappings[profilePropertyMapping.sourceProperty] = profilePropertyMapping;
                }
            }
            var _a;
        };
        AutoMapper.prototype.mapInternal = function (mapping, sourceObject) {
            // TODO handle synchronize async mapping (?)
            if (mapping.async) {
                throw new Error('Impossible to use asynchronous mapping using automapper.map(); use automapper.mapAsync() instead.');
            }
            if (_super.prototype.isArray.call(this, sourceObject)) {
                return this.mapArray(mapping, sourceObject);
            }
            return mapping.mapItemFunction(mapping, sourceObject, _super.prototype.createDestinationObject.call(this, mapping.destinationTypeClass));
        };
        /**
         * Execute a mapping from the source array to a new destination array with explicit mapping configuration and supplied mapping options (using createMap).
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param sourceArray The source array to map.
         * @returns {Array<any>} Destination array.
         */
        AutoMapper.prototype.mapArray = function (mapping, sourceArray) {
            var destinationArray = _super.prototype.handleArray.call(this, mapping, sourceArray, function (sourceObject, destinationObject) {
                mapping.mapItemFunction(mapping, sourceObject, destinationObject);
            });
            return destinationArray;
        };
        /**
         * Execute a mapping from the source object to a new destination object with explicit mapping configuration and supplied mapping options (using createMap).
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param sourceObject The source object to map.
         * @param destinationObject The destination object to map to.
         * @param arrayIndex The array index number, if this is an array being mapped.
         */
        AutoMapper.prototype.mapItem = function (mapping, sourceObject, destinationObject) {
            var _this = this;
            _super.prototype.handleItem.call(this, mapping, sourceObject, destinationObject, function (propertyName) {
                _this.mapProperty(mapping, sourceObject, destinationObject, propertyName);
            });
            return destinationObject;
        };
        /**
         * Execute a mapping from the source object to a new destination object with explicit mapping configuration and supplied mapping options (using createMap).
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param sourceObject The source object to map.
         * @param arrayIndex The array index number, if this is an array being mapped.
         * @returns {any} Destination object.
         */
        AutoMapper.prototype.mapItemUsingTypeConverter = function (mapping, sourceObject, destinationObject, arrayIndex) {
            var resolutionContext = {
                sourceValue: sourceObject,
                destinationValue: destinationObject
            };
            return mapping.typeConverterFunction(resolutionContext);
        };
        /**
         * Execute a mapping from the source object property to the destination object property with explicit mapping configuration and supplied mapping options.
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param sourceObject The source object to map.
         * @param sourceProperty The source property to map.
         * @param destinationObject The destination object to map to.
         */
        AutoMapper.prototype.mapProperty = function (mapping, sourceObject, destinationObject, sourceProperty) {
            var _this = this;
            _super.prototype.handleProperty.call(this, mapping, sourceObject, sourceProperty, destinationObject, function (destinationProperty, valuesAndFunctions, opts) {
                var destinationPropertyValue = _this.handlePropertyMappings(valuesAndFunctions, opts);
                _super.prototype.setPropertyValue.call(_this, mapping, destinationObject, destinationProperty, destinationPropertyValue);
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
        AutoMapper.instance = new AutoMapper();
        return AutoMapper;
    })(AutoMapperJs.AutoMapperBase);
    AutoMapperJs.AutoMapper = AutoMapper;
})(AutoMapperJs || (AutoMapperJs = {}));
// Add AutoMapper to the application's global scope. Of course, you could still use Core.AutoMapper.getInstance() as well.
var automapper = (function (app) {
    app.automapper = AutoMapperJs.AutoMapper.getInstance();
    return app.automapper;
})(this);

//# sourceMappingURL=AutoMapper.js.map
/// <reference path="../../dist/arcady-automapper-interfaces.d.ts" />
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
         * @returns {Core.IAutoMapperCreateMapChainingFunctions}
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
    })();
    AutoMapperJs.Profile = Profile;
})(AutoMapperJs || (AutoMapperJs = {}));

//# sourceMappingURL=Profile.js.map
/// <reference path="../../dist/arcady-automapper-interfaces.d.ts" />
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
    })();
    AutoMapperJs.TypeConverter = TypeConverter;
})(AutoMapperJs || (AutoMapperJs = {}));

//# sourceMappingURL=TypeConverter.js.map
/// <reference path="../../../dist/arcady-automapper-interfaces.d.ts" />
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
    })();
    AutoMapperJs.CamelCaseNamingConvention = CamelCaseNamingConvention;
})(AutoMapperJs || (AutoMapperJs = {}));

//# sourceMappingURL=../naming-conventions/CamelCaseNamingConvention.js.map
/// <reference path="../../../dist/arcady-automapper-interfaces.d.ts" />
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
    })();
    AutoMapperJs.PascalCaseNamingConvention = PascalCaseNamingConvention;
})(AutoMapperJs || (AutoMapperJs = {}));

//# sourceMappingURL=../naming-conventions/PascalCaseNamingConvention.js.map