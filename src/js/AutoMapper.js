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
