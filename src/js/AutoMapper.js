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
            var memberMapping = this.getOrCreateMemberMapping(mapping, destinationProperty, false);
            // do not add additional mappings to a member that is already ignored.
            if (memberMapping.ignore) {
                return toReturnFunctions;
            }
            // store original source property name (cloned)
            var originalSourcePropertyName = "" + memberMapping.sourceProperty;
            if (typeof valueOrFunction === 'function') {
                this.createMapForMemberHandleMappingFunction(mapping, memberMapping, valueOrFunction);
            }
            else {
                memberMapping.mappingValuesAndFunctions.push(valueOrFunction);
            }
            // if this createMapForMember operation changes the source member (e.g. when mapFrom was specified), we delete
            // the existing member mapping from the dictionary. After that, we add the merged member mapping to the dictionary
            // with the new source member as key.
            if (originalSourcePropertyName !== memberMapping.sourceProperty) {
                delete mapping.forMemberMappings[originalSourcePropertyName];
                mapping.forMemberMappings[memberMapping.sourceProperty] = memberMapping;
            }
            return toReturnFunctions;
        };
        AutoMapper.prototype.getOrCreateMemberMapping = function (mapping, property, sourceMapping) {
            // find existing mapping for member
            var memberMapping = sourceMapping
                ? mapping.forMemberMappings[property]
                : this.findMemberForDestinationProperty(mapping, property);
            if (memberMapping === null || memberMapping === undefined) {
                // set defaults for member mapping
                memberMapping = {
                    sourceProperty: property,
                    destinationProperty: property,
                    sourceMapping: sourceMapping,
                    mappingValuesAndFunctions: new Array(),
                    ignore: false,
                    async: false,
                    conditionFunction: undefined
                };
                mapping.forMemberMappings[property] = memberMapping;
            }
            return memberMapping;
        };
        /**
         * Try to locate an existing member mapping given a destination property name.
         * @param {IMapping} mapping The mapping configuration for the current mapping keys/types.
         * @param {string} destinationProperty The destination member property name.
         * @returns {IForMemberMapping} Existing member mapping if found; otherwise, null.
         */
        AutoMapper.prototype.findMemberForDestinationProperty = function (mapping, destinationPropertyName) {
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
                this.asyncAutoMapper.createMapForMemberFunction(mapping, memberMapping, memberConfigFunc);
            }
        };
        AutoMapper.prototype.createMapForMemberHandleSyncMappingFunction = function (memberMapping, memberConfigFunc) {
            var configFuncOptions = this.createMockDestinationMemberConfigOptions(memberMapping);
            // actually call the (mocked) member config function.
            try {
                memberConfigFunc(configFuncOptions);
            }
            catch (err) {
            }
            if (!memberMapping.ignore) {
                memberMapping.mappingValuesAndFunctions.push(memberConfigFunc);
            }
        };
        AutoMapper.prototype.createMockDestinationMemberConfigOptions = function (memberMapping) {
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
            return configFuncOptions;
        };
        /**
         * Customize configuration for an individual source member.
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param toReturnFunctions The functions object to return to enable fluent layout behavior.
         * @param sourceProperty The source member property name.
         * @param memberConfigFunc The function to use for this individual member.
         * @returns {Core.IAutoMapperCreateMapChainingFunctions}
         */
        AutoMapper.prototype.createMapForSourceMember = function (mapping, toReturnFunctions, sourceProperty, memberConfigFunc) {
            if (typeof memberConfigFunc !== 'function') {
                throw new Error('Configuration of forSourceMember has to be a function with one (sync) or two (async) options parameters.');
            }
            var memberMapping = this.getOrCreateMemberMapping(mapping, sourceProperty, true);
            // do not add additional mappings to a member that is already ignored.
            if (memberMapping.ignore) {
                return toReturnFunctions;
            }
            if (AutoMapperJs.AutoMapperHelper.getFunctionParameters(memberConfigFunc).length <= 1) {
                this.createMapForSourceMemberHandleSyncMappingFunction(memberMapping, memberConfigFunc);
            }
            else {
                this.asyncAutoMapper.createMapForSourceMemberFunction(mapping, memberMapping, memberConfigFunc);
            }
            return toReturnFunctions;
        };
        AutoMapper.prototype.createMapForSourceMemberHandleSyncMappingFunction = function (memberMapping, memberConfigFunc) {
            var configFuncOptions = {
                ignore: function () {
                    memberMapping.ignore = true;
                    memberMapping.async = false;
                    memberMapping.mappingValuesAndFunctions = new Array();
                    memberMapping.destinationProperty = undefined;
                }
            };
            memberConfigFunc(configFuncOptions);
            if (!memberMapping.ignore) {
                memberMapping.mappingValuesAndFunctions.push(memberConfigFunc);
            }
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
            try {
                // check if sync: TypeConverter instance
                if (typeConverterClassOrFunction instanceof AutoMapperJs.TypeConverter) {
                    this.configureSynchronousConverterFunction(mapping, typeConverterClassOrFunction.convert);
                    return;
                }
                // check if sync: TypeConverter class definition
                var typeConverter;
                try {
                    typeConverter = (new typeConverterClassOrFunction());
                }
                catch (e) {
                }
                if (typeConverter instanceof AutoMapperJs.TypeConverter) {
                    this.configureSynchronousConverterFunction(mapping, typeConverter.convert);
                    return;
                }
                var functionParameters = AutoMapperJs.AutoMapperHelper.getFunctionParameters(typeConverterClassOrFunction);
                // check if sync: function with resolutionContext parameter
                if (functionParameters.length === 1) {
                    this.configureSynchronousConverterFunction(mapping, typeConverterClassOrFunction);
                    return;
                }
                // check if async: function with resolutionContext and callback parameters
                if (functionParameters.length === 2) {
                    this.asyncAutoMapper.createMapConvertUsing(mapping, typeConverterClassOrFunction);
                    return;
                }
                // okay, just try feeding the function to the configure function anyway...
                this.configureSynchronousConverterFunction(mapping, typeConverterClassOrFunction);
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
                var existingPropertyMapping = this.findMemberForDestinationProperty(mapping, profilePropertyMapping.destinationProperty);
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