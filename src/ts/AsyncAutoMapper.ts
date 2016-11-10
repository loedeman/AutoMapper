/// <reference path="../../dist/automapper-interfaces.d.ts" />
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

        constructor() {
            super();
            AsyncAutoMapper.asyncInstance = this;
        }

        public createMap(sourceKeyOrType: string | (new() => any), destinationKeyOrType: string | (new() => any)): any {
            throw new Error('Method AsyncAutoMapper.createMap is not implemented.');
        }

        public createMapForMember(property: IProperty,
                                  func: ((opts: IMemberConfigurationOptions, cb: IMemberCallback) => void),
                                  metadata: IMemberMappingMetaData): void {
            var {mapping} = property.metadata;

            mapping.async = true;
            mapping.mapItemFunction = (m: IMapping, srcObj: any, dstObj: any, cb: IMapCallback) => this.mapItem(m, srcObj, dstObj, cb);
            property.async = true;
            property.conversionValuesAndFunctions.push(func);
        }

        public createMapConvertUsing(mapping: IMapping, converterFunction: (ctx: IResolutionContext, cb: IMapCallback) => void): void {
            mapping.async = true;
            mapping.typeConverterFunction = converterFunction;
            mapping.mapItemFunction = (m: IMapping, srcObj: any, dstObj: any, cb: IMapCallback) => this.mapItemUsingTypeConverter(m, srcObj, dstObj, cb);
        }

        public map(m: { [key: string]: IMapping }, srcKey: string | (new () => any)): (dstKey: string | (new () => any), srcObj: any, cb: IMapCallback) => void;
        public map(m: { [key: string]: IMapping }, srcKey: string | (new () => any), dstKey: string | (new () => any)): (srcObj: any, cb: IMapCallback) => void;
        public map(m: { [key: string]: IMapping }, srcKey: string | (new () => any), dstKey?: string | (new () => any), sourceObject?: any): (cb: IMapCallback) => void;
        public map(m: { [key: string]: IMapping }, srcKey: string | (new () => any), dstKey?: string | (new () => any), sourceObject?: any, cb?: IMapCallback): void;
        public map(mappings: { [key: string]: IMapping },
                   sourceKey: string | (new () => any),
                   destinationKey?: string | (new () => any),
                   sourceObject?: any,
                   callback?: IMapCallback): any /* actually, void (impossible with overloads) */ {

            switch (arguments.length) {
                case 5:
                    this.mapWithMapping(super.getMapping(mappings, sourceKey, destinationKey), sourceObject, callback);
                    return;
                // provide performance optimized (preloading) currying support.
                case 4:
                    return (cb: IMapCallback) => this.mapWithMapping(super.getMapping(mappings, sourceKey, destinationKey), sourceObject, cb);
                case 3:
                    return (srcObj: any, cb: IMapCallback) => this.mapWithMapping(super.getMapping(mappings, sourceKey, destinationKey), srcObj, cb);
                case 2:
                    return (dstKey: string | (new () => any), srcObj: any, cb: IMapCallback) => this.map(mappings, sourceKey, dstKey, srcObj, cb);
                default:
                    throw new Error('The AsyncAutoMapper.map function expects between 2 and 5 parameters, you provided ' + arguments.length + '.');
            }
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
                });
            });

            var waitForCallbackToSend = (): void => {
                if (callbacksToGo === 0) {
                    callback(destinationArray);
                } else {
                    setTimeout((): void => {
                        waitForCallbackToSend();
                    }, 10 * callbacksToGo);
                }
            };

            waitForCallbackToSend();
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
                });
            });

            var waitForCallbackToSend = (): void => {
                if (callbacksToGo === 0) {
                    callback(destinationObject);
                } else {
                    setTimeout((): void => {
                        waitForCallbackToSend();
                    }, 10 * callbacksToGo);
                }
            };

            waitForCallbackToSend();
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
                (destinations: IProperty[], valuesAndFunctions: Array<any>, opts: IMemberConfigurationOptions) => {
                    this.handlePropertyMappings(valuesAndFunctions, opts, (destinationPropertyValue: any) => {
                        for (let destination of destinations) {
                            super.setPropertyValue(mapping, destinationObject, destination, destinationPropertyValue);
                        }
                        callback(destinationPropertyValue);
                    });
                }, (destinationPropertyValue: any) => {
                    callback(destinationPropertyValue);
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
