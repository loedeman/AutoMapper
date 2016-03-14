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
