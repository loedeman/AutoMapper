var AutoMapperJs;
(function (AutoMapperJs) {
    'use strict';
    /**
     * AutoMapper implementation, for both creating maps and performing maps. Comparable usage and functionality to the original
     * .NET AutoMapper library is the pursuit of this implementation.
     */
    var AutoMapper = (function () {
        /**
         * Creates a new AutoMapper instance. This class is intended to be a Singleton.
         * Do not use the constructor directly from code. Use getInstance() function instead.
         * @constructor
         */
        function AutoMapper() {
            if (AutoMapper.instance) {
                throw new Error('Instantiation failed: Use getInstance() function instead of constructor function.');
            }
            AutoMapper.instance = this;
            this.mappings = {};
        }
        /**
         * Gets AutoMapper Singleton instance.
         * @returns {Core.AutoMapper}
         */
        AutoMapper.getInstance = function () {
            return AutoMapper.instance;
        };
        /**
         * Create a mapping profile.
         * @param {string} sourceKey The map source key.
         * @param {string} destinationKey The map destination key.
         * @returns {Core.IAutoMapperCreateMapChainingFunctions}
         */
        AutoMapper.prototype.createMap = function (sourceKey, destinationKey) {
            var _this = this;
            var mappingKey = sourceKey + destinationKey;
            // create a mapping object for the given keys
            var mapping = {
                key: mappingKey,
                forAllMemberMappings: new Array(),
                forMemberMappings: {},
                typeConverterFunction: undefined,
                destinationTypeClass: undefined
            };
            this.mappings[mappingKey] = mapping;
            // return an object with available 'sub' functions to enable method chaining (e.g. automapper.createMap().forMember().forMember() ...)
            var methodChainingFunctions = {
                forMember: function (destinationProperty, valueOrFunction) { return _this.createMapForMember(mapping, methodChainingFunctions, destinationProperty, valueOrFunction); },
                forSourceMember: function (sourceProperty, sourceMemberConfigurationFunction) { return _this.createMapForSourceMember(mapping, methodChainingFunctions, sourceProperty, sourceMemberConfigurationFunction); },
                forAllMembers: function (func) { return _this.createMapForAllMembers(mapping, methodChainingFunctions, func); },
                convertToType: function (typeClass) { return _this.createMapConvertToType(mapping, methodChainingFunctions, typeClass); },
                convertUsing: function (typeConverterClassOrFunction) { return _this.createMapConvertUsing(mapping, typeConverterClassOrFunction); }
            };
            return methodChainingFunctions;
        };
        /**
         * Execute a mapping from the source object to a new destination object with explicit mapping configuration and supplied mapping options (using createMap).
         * @param sourceKey Source key, for instance the source type name.
         * @param destinationKey Destination key, for instance the destination type name.
         * @param sourceObject The source object to map.
         * @returns {any} Destination object.
         */
        AutoMapper.prototype.map = function (sourceKey, destinationKey, sourceObject) {
            var mappingKey = sourceKey + destinationKey;
            var mapping = this.mappings[mappingKey];
            if (!mapping) {
                throw new Error("Could not find map object with a source of " + sourceKey + " and a destination of " + destinationKey);
            }
            if (sourceObject instanceof Array) {
                return this.mapArray(mapping, sourceObject);
            }
            return this.mapItem(mapping, sourceObject);
        };
        /**
         * Execute a mapping from the source array to a new destination array with explicit mapping configuration and supplied mapping options (using createMap).
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param sourceArray The source array to map.
         * @returns {Array<any>} Destination array.
         */
        AutoMapper.prototype.mapArray = function (mapping, sourceArray) {
            // create empty destination array.
            var destinationArray = new Array();
            for (var index = 0, length = sourceArray.length; index < length; index++) {
                var sourceObject = sourceArray[index];
                var destinationObject = this.mapItem(mapping, sourceObject, index);
                if (destinationObject)
                    destinationArray.push(destinationObject);
            }
            return destinationArray;
        };
        /**
         * Execute a mapping from the source object to a new destination object with explicit mapping configuration and supplied mapping options (using createMap).
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param sourceObject The source object to map.
         * @param arrayIndex The array index number, if this is an array being mapped.
         * @returns {any} Destination object.
         */
        AutoMapper.prototype.mapItem = function (mapping, sourceObject, arrayIndex) {
            if (arrayIndex === void 0) { arrayIndex = undefined; }
            // create empty destination object.
            // ReSharper disable InconsistentNaming
            var destinationObject = mapping.destinationTypeClass
                ? new mapping.destinationTypeClass()
                : {};
            // ReSharper restore InconsistentNaming
            if (mapping.typeConverterFunction) {
                var resolutionContext = {
                    sourceValue: sourceObject,
                    destinationValue: destinationObject
                };
                return mapping.typeConverterFunction(resolutionContext);
            }
            for (var sourcePropertyName in sourceObject) {
                if (!sourceObject.hasOwnProperty(sourcePropertyName)) {
                    continue;
                }
                this.mapProperty(mapping, sourceObject, sourcePropertyName, destinationObject);
            }
            return destinationObject;
        };
        /**
         * Customize configuration for an individual destination member.
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param toReturnFunctions The functions object to return to enable fluent layout behavior.
         * @param sourceProperty The destination member property name.
         * @param valueOrFunction The value or function to use for this individual member.
         * @returns {Core.IAutoMapperCreateMapChainingFunctions}
         */
        AutoMapper.prototype.createMapForMember = function (mapping, toReturnFunctions, destinationProperty, valueOrFunction) {
            // set defaults
            var ignore = false;
            var sourceProperty = destinationProperty;
            var mappingValueOrFunction = valueOrFunction;
            if (typeof valueOrFunction === 'function') {
                var destinationMemberConfigurationFunctionOptions = {
                    ignore: function () {
                        ignore = true;
                        mappingValueOrFunction = undefined;
                    },
                    mapFrom: function (sourcePropertyName) {
                        sourceProperty = sourcePropertyName;
                    }
                };
                valueOrFunction(destinationMemberConfigurationFunctionOptions);
            }
            var memberMapping = {
                sourceProperty: sourceProperty,
                destinationProperty: destinationProperty,
                mappingValueOrFunction: mappingValueOrFunction,
                destinationMapping: true,
                ignore: ignore
            };
            // if there already is a mapping for this destination (!) member, delete it and add the new mapping.
            // ideally, we would not use deletion but overwriting could be troublesome if the previous mapping has
            // another source property (e.g. when using opts.mapFrom).
            for (var property in mapping.forMemberMappings) {
                if (!mapping.forMemberMappings.hasOwnProperty(property))
                    continue;
                var existingMemberMapping = mapping.forMemberMappings[property];
                if (existingMemberMapping.destinationProperty === destinationProperty) {
                    //mapping.forMemberMappings[property] = memberMapping;
                    //return toReturnFunctions;
                    delete mapping.forMemberMappings[property];
                }
            }
            mapping.forMemberMappings[sourceProperty] = memberMapping;
            return toReturnFunctions;
        };
        /**
         * Customize configuration for an individual source member.
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param toReturnFunctions The functions object to return to enable fluent layout behavior.
         * @param sourceProperty The source member property name.
         * @param sourceMemberConfigurationFunction The function to use for this individual member.
         * @returns {Core.IAutoMapperCreateMapChainingFunctions}
         */
        AutoMapper.prototype.createMapForSourceMember = function (mapping, toReturnFunctions, sourceProperty, sourceMemberConfigurationFunction) {
            // set defaults
            var ignore = false;
            var destinationProperty = sourceProperty;
            var mappingValueOrFunction = sourceMemberConfigurationFunction;
            if (typeof sourceMemberConfigurationFunction !== 'function') {
                throw new Error('Configuration of forSourceMember has to be a function with one options parameter.');
            }
            var sourceMemberConfigurationFunctionOptions = {
                ignore: function () {
                    ignore = true;
                    destinationProperty = undefined;
                    mappingValueOrFunction = undefined;
                }
            };
            sourceMemberConfigurationFunction(sourceMemberConfigurationFunctionOptions);
            mapping.forMemberMappings[sourceProperty] = {
                sourceProperty: sourceProperty,
                destinationProperty: destinationProperty,
                mappingValueOrFunction: mappingValueOrFunction,
                destinationMapping: false,
                ignore: ignore
            };
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
         * Specify to which class type AutoMapper should convert. When specified, AutoMapper will create an instance of the given type, instead of returning a new object literal.
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param toReturnFunctions The functions object to return to enable fluent layout behavior.
         * @param typeClass The destination type class.
         * @returns {Core.IAutoMapperCreateMapChainingFunctions}
         */
        AutoMapper.prototype.createMapConvertToType = function (mapping, toReturnFunctions, typeClass) {
            mapping.destinationTypeClass = typeClass;
            return toReturnFunctions;
        };
        /**
         * Skip normal member mapping and convert using a custom type converter (instantiated during mapping).
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param typeConverterClassOrFunction The converter class or function to use when converting.
         */
        AutoMapper.prototype.createMapConvertUsing = function (mapping, typeConverterClassOrFunction) {
            var typeConverterFunction;
            // 1. check if a function with one parameter is provided; if so, assume it to be the convert function.
            // 2. check if an instance of TypeConverter is provided; in that case, there will be a convert function.
            // 3. assume we are dealing with a class definition, instantiate it and store its convert function.
            // [4. okay, really? the dev providing typeConverterClassOrFunction appears to be an idiot - fire him/her :P .]
            try {
                if (this.getFunctionParameters(typeConverterClassOrFunction).length === 1) {
                    typeConverterFunction = typeConverterClassOrFunction;
                }
                else if (typeConverterClassOrFunction instanceof AutoMapperJs.TypeConverter) {
                    typeConverterFunction = typeConverterClassOrFunction.convert;
                }
                else {
                    // ReSharper disable InconsistentNaming
                    typeConverterFunction = (new typeConverterClassOrFunction()).convert;
                }
            }
            catch (e) {
                throw new Error("The value provided for typeConverterClassOrFunction is invalid. Exception: " + e);
            }
            if (!typeConverterFunction || this.getFunctionParameters(typeConverterFunction).length !== 1) {
                throw new Error('The value provided for typeConverterClassOrFunction is invalid, because it does not provide exactly one (resolutionContext) parameter.');
            }
            mapping.typeConverterFunction = typeConverterFunction;
        };
        /**
         * Execute a mapping from the source object property to the destination object property with explicit mapping configuration and supplied mapping options.
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param sourceObject The source object to map.
         * @param sourceObject The source property to map.
         * @param destinationObject The destination object to map to.
         */
        AutoMapper.prototype.mapProperty = function (mapping, sourceObject, sourcePropertyName, destinationObject) {
            var propertyMapping = mapping.forMemberMappings[sourcePropertyName];
            if (propertyMapping) {
                // a forMember mapping exists
                // ignore ignored properties
                if (propertyMapping.ignore)
                    return;
                var destinationMemberConfigurationFunctionOptions = {
                    mapFrom: function () {
                        // no action required, just here as a stub to prevent calling a non-existing 'opts.mapFrom()' function.
                    }
                };
                var destinationPropertyValue;
                if (propertyMapping.destinationMapping && typeof propertyMapping.mappingValueOrFunction === 'function') {
                    destinationPropertyValue = propertyMapping.mappingValueOrFunction(destinationMemberConfigurationFunctionOptions);
                    if (typeof destinationPropertyValue === 'undefined')
                        destinationPropertyValue = sourceObject[propertyMapping.sourceProperty];
                }
                else {
                    // mappingValueOrFunction is a value
                    destinationPropertyValue = propertyMapping.mappingValueOrFunction;
                }
                this.mapSetValue(mapping, destinationObject, propertyMapping.destinationProperty, destinationPropertyValue);
            }
            else {
                // no forMember mapping exists
                this.mapSetValue(mapping, destinationObject, sourcePropertyName, sourceObject[sourcePropertyName]);
            }
        };
        /**
         * Set the mapped value on the destination object, either direct or via the (optionally) supplied forAllMembers function(s).
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param propertyMapping The mapping property configuration for the current property.
         * @param destinationObject The destination object to map to.
         * @param destinationPropertyValue The destination value.
         */
        AutoMapper.prototype.mapSetValue = function (mapping, destinationObject, destinationPropertyName, destinationPropertyValue) {
            if (mapping.forAllMemberMappings.length > 0) {
                for (var i = 0; i < mapping.forAllMemberMappings.length; i++) {
                    mapping.forAllMemberMappings[i](destinationObject, destinationPropertyName, destinationPropertyValue);
                }
            }
            else {
                destinationObject[destinationPropertyName] = destinationPropertyValue;
            }
        };
        // TODO BL Perhaps move to separate utility class?
        AutoMapper.prototype.getFunctionParameters = function (func) {
            var stripComments = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
            var argumentNames = /([^\s,]+)/g;
            var functionString = func.toString().replace(stripComments, '');
            var functionParameterNames = functionString.slice(functionString.indexOf('(') + 1, functionString.indexOf(')')).match(argumentNames);
            if (functionParameterNames === null)
                functionParameterNames = new Array();
            return functionParameterNames;
        };
        AutoMapper.instance = new AutoMapper();
        return AutoMapper;
    })();
    AutoMapperJs.AutoMapper = AutoMapper;
})(AutoMapperJs || (AutoMapperJs = {}));
// Add AutoMapper to the application's global scope. Of course, you can still use Core.AutoMapper.getInstance() as well.
var automapper = (function (app) {
    if (app.automapper) {
        return app.automapper;
    }
    app.automapper = AutoMapperJs.AutoMapper.getInstance();
    return app.automapper;
})(this);
//# sourceMappingURL=AutoMapper.js.map