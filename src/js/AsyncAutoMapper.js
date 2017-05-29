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
