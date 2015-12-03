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
        AsyncAutoMapper.prototype.createMapForMember = function (mapping, property, func, metadata) {
            var _this = this;
            mapping.async = true;
            mapping.mapItemFunction = function (m, srcObj, dstObj, cb) { return _this.mapItem(m, srcObj, dstObj, cb); };
            property.async = true;
            property.conversionValuesAndFunctions.push(func);
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
            _super.prototype.handleProperty.call(this, mapping, sourceObject, sourceProperty, destinationObject, function (destinations, valuesAndFunctions, opts) {
                _this.handlePropertyMappings(valuesAndFunctions, opts, function (destinationPropertyValue) {
                    for (var _i = 0; _i < destinations.length; _i++) {
                        var destination = destinations[_i];
                        _super.prototype.setPropertyValue.call(_this, mapping, destinationObject, destination, destinationPropertyValue);
                    }
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
