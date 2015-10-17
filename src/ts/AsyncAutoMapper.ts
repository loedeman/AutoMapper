/// <reference path="../../dist/arcady-automapper-interfaces.d.ts" />
/// <reference path="AutoMapper.ts" />
/// <reference path="TypeConverter.ts" />
/// <reference path="AutoMapperHelper.ts" />
/// <reference path="AutoMapperValidator.ts" />

module AutoMapperJs {
    'use strict';

    /**
     * AsyncAutoMapper implementation, for asynchronous mapping support when using AutoMapper.
     */
    export class AsyncAutoMapper extends AutoMapperBase {
        private static asyncInstance = new AsyncAutoMapper();

        /**
         * Creates a new AsyncAutoMapper instance. This class is intended to be a Singleton.
         * Do not use the constructor directly from code. Use getInstance() function instead.
         * @constructor
         */
        constructor() {
            super();
            AsyncAutoMapper.asyncInstance = this;
        }

        /**
         * Gets AutoMapper Singleton instance.
         * @returns {Core.AutoMapper}
         */
        public static getInstance(): AsyncAutoMapper {
            return AsyncAutoMapper.asyncInstance;
        }

        public createMapForMemberFunction(mapping: IMapping, memberMapping: IForMemberMapping,
            memberConfigFunc: ((opts: IMemberConfigurationOptions, cb: IMemberCallback) => void)): void {
            mapping.async = true;
            mapping.mapItemFunction = (m: IMapping, srcObj: any, dstObj: any, cb: IMapCallback) => this.mapItem(m, srcObj, dstObj, cb);
            memberMapping.async = true;
            memberMapping.mappingValuesAndFunctions.push(memberConfigFunc);
        }

        public createMapForSourceMemberFunction(mapping: IMapping, memberMapping: IForMemberMapping,
            memberConfigFunc: (opts: ISourceMemberConfigurationOptions, cb: IMemberCallback) => void): void {
            mapping.async = true;
            mapping.mapItemFunction = (m: IMapping, srcObj: any, dstObj: any, cb: IMapCallback) => this.mapItem(m, srcObj, dstObj, cb);
            memberMapping.async = true;
            memberMapping.mappingValuesAndFunctions.push(memberConfigFunc);
        }

        public createMapConvertUsing(mapping: IMapping, converterFunction: (ctx: IResolutionContext, cb: IMapCallback) => void): void {
            mapping.async = true;
            mapping.typeConverterFunction = converterFunction;
            mapping.mapItemFunction = (m: IMapping, srcObj: any, dstObj: any, cb: IMapCallback): void => this.mapItemUsingTypeConverter(m, srcObj, dstObj, cb);
        }

        public map(sourceKey: string | (new () => any),
            destinationKey: string | (new () => any),
            mappings: { [key: string]: IMapping },
            sourceObject: any,
            callback: IMapCallback): any {

            if (arguments.length === 5) {
                this.mapWithMapping(super.getMapping(mappings, sourceKey, destinationKey), sourceObject, callback);
                return;
            }

            // provide performance optimized (preloading) currying support.
            if (arguments.length === 2) {
                return (srcObj: any, callback: IMapCallback) => this.mapWithMapping(super.getMapping(mappings, sourceKey, destinationKey), srcObj, callback);
            }

            if (arguments.length === 1) {
                return (dstKey: string | (new () => any), srcObj: any, callback: IMapCallback) => this.map(sourceKey, dstKey, mappings, srcObj, callback);
            }

            return (srcKey: string | (new () => any), dstKey: string | (new () => any), srcObj: any) => this.map(srcKey, dstKey, mappings, srcObj, callback);
        }

        public mapWithMapping(mapping: IMapping, sourceObject: any, callback: IMapCallback): void {
            if (super.isArray(sourceObject)) {
                this.mapArray(mapping, sourceObject, callback);
                return;
            }

            return (<IAsyncMapItemFunction>mapping.mapItemFunction)(mapping, sourceObject, super.createDestinationObject(mapping.destinationTypeClass), callback);
        }

        /**
         * Execute a mapping from the source array to a new destination array with explicit mapping configuration and supplied mapping options (using createMap).
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param sourceArray The source array to map.
         * @returns {Array<any>} Destination array.
         */
        private mapArray(mapping: IMapping, sourceArray: Array<any>, callback: IMapCallback): void {
            var callbacksToGo = 0;

            var destinationArray = super.handleArray(mapping, sourceArray, (sourceObject: any, destinationObject: any) => {
                callbacksToGo++;
                (<IAsyncMapItemFunction>mapping.mapItemFunction)(mapping, sourceObject, destinationObject, (result: any): void => {
                    callbacksToGo--;
                    if (callbacksToGo === 0) {
                        callback(destinationArray);
                    }
                });
            });
        }

        private mapItemUsingTypeConverter(mapping: IMapping, sourceObject: any, destinationObject: any, callback: IMapCallback): void {
            var resolutionContext: IResolutionContext = {
                sourceValue: sourceObject,
                destinationValue: destinationObject
            };
            (<(ctx: IResolutionContext, cb: IMapCallback) => any>mapping.typeConverterFunction)(resolutionContext, callback);
        }

        /**
         * Execute a mapping from the source object to a new destination object with explicit mapping configuration and supplied mapping options (using createMap).
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param sourceObject The source object to map.
         * @param destinationObject The destination object to map to.
         * @param callback The callback to call after async mapping has been executed.
         */
        private mapItem(mapping: IMapping, sourceObject: any, destinationObject: any, callback: IMapCallback): void {
            var callbacksToGo = 0;

            super.handleItem(mapping, sourceObject, destinationObject, (sourceProperty: string) => {
                callbacksToGo++;
                this.mapProperty(mapping, sourceObject, sourceProperty, destinationObject, (result: any): void => {
                    callbacksToGo--;
                    if (callbacksToGo === 0) {
                        callback(destinationObject);
                    }
                });
            });
        }

        /**
         * Execute a mapping from the source object property to the destination object property with explicit mapping configuration and supplied mapping options.
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param sourceObject The source object to map.
         * @param sourcePropertyName The source property to map.
         * @param destinationObject The destination object to map to.
         * @param callback The callback to call after async property mapping has been executed.
         */
        private mapProperty(mapping: IMapping, sourceObject: any, sourceProperty: string, destinationObject: any, callback: IMemberCallback): void {
            super.handleProperty(mapping, sourceObject, sourceProperty, destinationObject,
                (destinationProperty: string, valuesAndFunctions: Array<any>, opts: IMemberConfigurationOptions) => {
                    this.handlePropertyMappings(valuesAndFunctions, opts, (destinationPropertyValue: any) => {
                        super.setPropertyValue(mapping, destinationObject, destinationProperty, destinationPropertyValue);
                        callback(destinationPropertyValue);
                    });
                });
        }

        private handlePropertyMappings(valuesAndFunctions: Array<any>, opts: IMemberConfigurationOptions, callback: IMemberCallback): void {
            if (!valuesAndFunctions || valuesAndFunctions.length === 0) {
                callback(opts.intermediatePropertyValue);
                return;
            }

            var valueOrFunction = valuesAndFunctions[0];

            if (typeof valueOrFunction === 'function') {
                this.handlePropertyMappingFunction(valueOrFunction, opts, (result: any) => {
                    if (typeof result !== 'undefined') {
                        opts.intermediatePropertyValue = result;

                        // recursively walk values/functions
                        this.handlePropertyMappings(valuesAndFunctions.slice(1), opts, callback);
                    }
                });
            } else {
                // valueOrFunction is a value
                opts.intermediatePropertyValue = valueOrFunction;

                // recursively walk values/functions
                this.handlePropertyMappings(valuesAndFunctions.slice(1), opts, callback);
            }
        }

        private handlePropertyMappingFunction(func: Function, opts: IMemberConfigurationOptions, callback: IMemberCallback): void {
            // check if function is asynchronous
            var args = AutoMapperHelper.getFunctionParameters(func);
            if (args.length === 2) { // asynchronous: opts, callback
                func(opts, callback);
                return;
            }

            callback(func(opts));
        }
    }
}