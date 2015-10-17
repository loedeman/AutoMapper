/// <reference path="../../dist/arcady-automapper-interfaces.d.ts" />
/// <reference path="AutoMapperBase.ts" />
/// <reference path="AsyncAutoMapper.ts" />
/// <reference path="TypeConverter.ts" />
/// <reference path="AutoMapperHelper.ts" />
/// <reference path="AutoMapperValidator.ts" />

module AutoMapperJs {
    'use strict';

    type ICMChainFunc = IAutoMapperCreateMapChainingFunctions;

    /**
     * AutoMapper implementation, for both creating maps and performing maps. Comparable usage and functionality to the original
     * .NET AutoMapper library is the pursuit of this implementation.
     */
    export class AutoMapper extends AutoMapperBase {
        private static instance = new AutoMapper();

        private profiles: { [name: string]: IProfile };
        private mappings: { [key: string]: IMapping };

        private asyncAutoMapper: AsyncAutoMapper;

        /**
         * Creates a new AutoMapper instance. This class is intended to be a Singleton.
         * Do not use the constructor directly from code. Use getInstance() function instead.
         * @constructor
         */
        constructor() {
            super();

            if (AutoMapper.instance) {
                return AutoMapper.instance;
            } else {
                AutoMapper.instance = this;

                this.profiles = {};
                this.mappings = {};

                this.asyncAutoMapper = new AsyncAutoMapper();
            }
        }

        /**
         * Gets AutoMapper Singleton instance.
         * @returns {Core.AutoMapper}
         */
        public static getInstance(): AutoMapper {
            return AutoMapper.instance;
        }

        /**
         * Initializes the mapper with the supplied configuration.
         * @param {(config: IConfiguration) => void} configFunction Configuration function to call.
         */
        public initialize(configFunction: (config: IConfiguration) => void): void {
            var that = this;

            // NOTE BL casting to any is needed, since TS does not fully support method overloading.
            var configuration: IConfiguration = <any>{
                addProfile: (profile: IProfile) : void => {
                    profile.configure();
                    that.profiles[profile.profileName] = profile;
                },
                createMap: function (sourceKey: string, destinationKey: string): ICMChainFunc {
                    // pass through using arguments to keep createMap's currying support fully functional.
                    return that.createMap.apply(that, arguments);
                }
            };
            configFunction(configuration);
        }

        /**
         * Create a mapping profile.
         * @param {string} sourceKey The map source key.
         * @param {string} destinationKey The map destination key.
         * @returns {Core.IAutoMapperCreateMapChainingFunctions}
         */
        public createMap(sourceKeyOrType: string | (new() => any), destinationKeyOrType: string | (new() => any)): ICMChainFunc {
            // provide currying support.
            if (arguments.length < 2) {
                return AutoMapperHelper.handleCurrying(this.createMap, arguments, this);
            }

            // create a mapping object for the given keys
            var mapping: IMapping = {
                sourceKey: super.getKey(sourceKeyOrType),
                destinationKey: super.getKey(destinationKeyOrType),
                forAllMemberMappings: new Array<(destinationObject: any, destinationPropertyName: string, value: any) => void>(),
                forMemberMappings: {},
                typeConverterFunction: undefined,
                mapItemFunction: (m: IMapping, srcObj: any, dstObj: any): any => this.mapItem(m, srcObj, dstObj),
                sourceTypeClass: (typeof sourceKeyOrType === 'string' ? undefined : sourceKeyOrType),
                destinationTypeClass: (typeof destinationKeyOrType === 'string' ? undefined : destinationKeyOrType),
                profile: undefined,
                async: false
            };
            this.mappings[mapping.sourceKey + mapping.destinationKey] = mapping;

            // return an object with available 'sub' functions to create a fluent interface / method chaining 
            // (e.g. automapper.createMap().forMember().forMember() ...)
            var fluentApiFuncs: ICMChainFunc = {
                forMember: (destinationProperty: string,
                            valueOrFunction: any|((opts: IMemberConfigurationOptions) => any)|((opts: IMemberConfigurationOptions, cb: IMemberCallback) => void)
                           ) : ICMChainFunc => this.createMapForMember(mapping, fluentApiFuncs, destinationProperty, valueOrFunction),
                forSourceMember: (sourceProperty: string,
                                  configFunction: ((opts: ISourceMemberConfigurationOptions) => any)|((opts: ISourceMemberConfigurationOptions, cb: IMemberCallback) => void)
                                 ) : ICMChainFunc => this.createMapForSourceMember(mapping, fluentApiFuncs, sourceProperty, configFunction),
                forAllMembers: (func: (destinationObject: any, destinationPropertyName: string, value: any) => void) : ICMChainFunc =>
                    this.createMapForAllMembers(mapping, fluentApiFuncs, func),
                ignoreAllNonExisting: () : ICMChainFunc =>
                    this.createMapIgnoreAllNonExisting(mapping, fluentApiFuncs),
                convertToType: (typeClass: new () => any) : ICMChainFunc =>
                    this.createMapConvertToType(mapping, fluentApiFuncs, typeClass),
                convertUsing: (typeConverterClassOrFunction: ((resolutionContext: IResolutionContext) => any) |
                                                             ((resolutionContext: IResolutionContext, callback: IMapCallback) => void) |
                                                             TypeConverter |
                                                             (new() => TypeConverter)) : void =>
                    this.createMapConvertUsing(mapping, typeConverterClassOrFunction),
                withProfile: (profileName: string) : void => this.createMapWithProfile(mapping, profileName)
            };
            return fluentApiFuncs;
        }

        /**
         * Execute a mapping from the source object to a new destination object with explicit mapping configuration and supplied mapping options (using createMap).
         * @param sourceKey Source key, for instance the source type name.
         * @param destinationKey Destination key, for instance the destination type name.
         * @param sourceObject The source object to map.
         * @returns {any} Destination object.
         */
        public map(sourceKeyOrType: string | (new() => any), destinationKeyOrType: string | (new() => any), sourceObject: any): any {
            if (arguments.length === 3) {
                return this.mapInternal(super.getMapping(this.mappings, sourceKeyOrType, destinationKeyOrType), sourceObject);
            }

            // provide performance optimized (preloading) currying support.
            if (arguments.length === 2) {
                return (srcObj: any) => this.mapInternal(super.getMapping(this.mappings, sourceKeyOrType, destinationKeyOrType), srcObj);
            }

            if (arguments.length === 1) {
                return (dstKey: string | (new() => any), srcObj: any) => this.map(sourceKeyOrType, dstKey, srcObj);
            }

            return (srcKey: string | (new() => any), dstKey: string | (new() => any), srcObj: any) => this.map(srcKey, dstKey, srcObj);
        }

        /**
         * Execute an asynchronous mapping from the source object to a new destination object with explicit mapping configuration and supplied mapping options (using createMap).
         * @param sourceKey Source key, for instance the source type name.
         * @param destinationKey Destination key, for instance the destination type name.
         * @param sourceObject The source object to map.
         * @param {IMapCallback} callback The callback to call when asynchronous mapping is complete.
         */
        public mapAsync(sourceKeyOrType: string | (new() => any), destinationKeyOrType: string | (new() => any), sourceObject: any, callback: IMapCallback): any {
            return this.asyncAutoMapper.map(sourceKeyOrType, destinationKeyOrType, this.mappings, sourceObject, callback);
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
        public assertConfigurationIsValid(strictMode: boolean = true): void {
            AutoMapperValidator.assertConfigurationIsValid(this.mappings, strictMode);
        }

        /**
         * Customize configuration for an individual destination member.
         * @param {IMapping} mapping The mapping configuration for the current mapping keys/types.
         * @param {IAutoMapperCreateMapChainingFunctions} toReturnFunctions The functions object to return to enable fluent layout behavior.
         * @param {string} destinationProperty The destination member property name.
         * @param valueOrFunction The value or function to use for this individual member.
         * @returns {Core.IAutoMapperCreateMapChainingFunctions}
         */
        private createMapForMember(mapping: IMapping,
                                   toReturnFunctions: ICMChainFunc,
                                   destinationProperty: string,
                                   valueOrFunction: any): ICMChainFunc {
            // find existing mapping for member
            var originalSourcePropertyName: string = undefined;
            var memberMapping: IForMemberMapping = this.createMapForMemberFindMember(mapping, destinationProperty);
            if (memberMapping !== null && memberMapping !== undefined) {
                // do not add additional mappings to a member that is already ignored.
                if (memberMapping.ignore) {
                    return toReturnFunctions;
                }

                // store original source property name (cloned)
                originalSourcePropertyName = `${memberMapping.sourceProperty}`;
            } else {
                // set defaults for member mapping
                memberMapping = {
                    sourceProperty: destinationProperty,
                    destinationProperty: destinationProperty,
                    sourceMapping: false,
                    mappingValuesAndFunctions: new Array<any>(),
                    ignore: false,
                    async: false,
                    conditionFunction: undefined
                };
            }

            if (typeof valueOrFunction === 'function') {
                this.createMapForMemberHandleMappingFunction(mapping, memberMapping, valueOrFunction);
            } else {
                memberMapping.mappingValuesAndFunctions.push(valueOrFunction);
            }

            // if this createMapForMember operation changes the source member (e.g. when mapFrom was specified), we delete
            // the existing member mapping from the dictionary. After that, we add the merged member mapping to the dictionary
            // with the new source member as key.
            if (!originalSourcePropertyName) {
                mapping.forMemberMappings[memberMapping.sourceProperty] = memberMapping;
            } else if (originalSourcePropertyName !== memberMapping.sourceProperty) {
                delete mapping.forMemberMappings[originalSourcePropertyName];
                mapping.forMemberMappings[memberMapping.sourceProperty] = memberMapping;
            }

            return toReturnFunctions;
        }

        /**
         * Try to locate an existing member mapping.
         * @param {IMapping} mapping The mapping configuration for the current mapping keys/types.
         * @param {string} destinationProperty The destination member property name.
         * @returns {IForMemberMapping} Existing member mapping if found; otherwise, null.
         */
        private createMapForMemberFindMember(mapping: IMapping, destinationPropertyName: string): IForMemberMapping {
            for (let property in mapping.forMemberMappings) {
                if (!mapping.forMemberMappings.hasOwnProperty(property)) {
                    continue;
                }

                let memberMapping = mapping.forMemberMappings[property];

                if (memberMapping.destinationProperty === destinationPropertyName) {
                    return memberMapping;
                }
            }

            return null;
        }

        private createMapForMemberHandleMappingFunction(mapping: IMapping,
                                                        memberMapping: IForMemberMapping,
                                                        memberConfigFunc: ((opts: IMemberConfigurationOptions) => any) |
                                                                          ((opts: IMemberConfigurationOptions, cb: IMemberCallback) => void)
                                                       ): void {
            var memberConfigFuncParameters = AutoMapperHelper.getFunctionParameters(memberConfigFunc);
            if (memberConfigFuncParameters.length <= 1) {
                this.createMapForMemberHandleSyncMappingFunction(memberMapping, <(opts: IMemberConfigurationOptions) => any>memberConfigFunc);
            } else {
                this.createMapForMemberHandleAsyncMappingFunction(mapping, memberMapping, <(opts: IMemberConfigurationOptions, cb: IMemberCallback) => void>memberConfigFunc);
            }
        }

        private createMapForMemberHandleSyncMappingFunction(memberMapping: IForMemberMapping, memberConfigFunc: (opts: IMemberConfigurationOptions) => any): void {
            var addMappingValueOrFunction = true;

            // Since we are calling the valueOrFunction function to determine whether to ignore or map from another property, we
            // want to prevent the call to be error prone when the end user uses the '(opts)=> opts.sourceObject.sourcePropertyName'
            // syntax. We don't actually have a source object when creating a mapping; therefore, we 'stub' a source object for the
            // function call.
            var sourceObject: any = {};
            sourceObject[memberMapping.sourceProperty] = {};

            // calling the function will result in calling our stubbed ignore() and mapFrom() functions if used inside the function.
            const configFuncOptions: IMemberConfigurationOptions = {
                ignore: (): void => {
                    // an ignored member effectively has no mapping values / functions. Remove potentially existing values / functions.
                    memberMapping.ignore = true;
                    memberMapping.sourceProperty = memberMapping.destinationProperty; // in case someone really tried mapFrom before.
                    memberMapping.mappingValuesAndFunctions = new Array<any>();
                    addMappingValueOrFunction = false;
                },
                condition: (predicate: ((sourceObject: any) => boolean)): void => {
                    memberMapping.conditionFunction = predicate;
                },
                mapFrom: (sourcePropertyName: string): void => {
                    memberMapping.sourceProperty = sourcePropertyName;
                },
                sourceObject: sourceObject,
                sourcePropertyName: memberMapping.sourceProperty,
                intermediatePropertyValue: {}
            };

            // actually call the (stubbed) member config function.
            try {
                memberConfigFunc(configFuncOptions);
            } catch (err) {
                // not foreseeable, but no problem at all (possible by design, like with the opts.condition() and mappingValuesAndFunctions 
                // methods). We have to catch all potential errors from calling the function, since we cannot predict which goals the end 
                // user tries do reach with the stubbed sourceObject property.
            }

            if (addMappingValueOrFunction) {
                memberMapping.mappingValuesAndFunctions.push(memberConfigFunc);
            }
        }

        private createMapForMemberHandleAsyncMappingFunction(mapping: IMapping,
                                                             memberMapping: IForMemberMapping,
                                                             memberConfigFunc: (opts: IMemberConfigurationOptions, cb: IMemberCallback) => void
                                                            ): void {
            this.asyncAutoMapper.createMapForMemberFunction(mapping, memberMapping, memberConfigFunc);
        }

        /**
         * Customize configuration for an individual source member.
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param toReturnFunctions The functions object to return to enable fluent layout behavior.
         * @param sourceProperty The source member property name.
         * @param memberConfigFunc The function to use for this individual member.
         * @returns {Core.IAutoMapperCreateMapChainingFunctions}
         */
        // TODO Refactor sync/async!
        private createMapForSourceMember(mapping: IMapping,
                                         toReturnFunctions: ICMChainFunc,
                                         sourceProperty: string,
                                         memberConfigFunc: ((opts: ISourceMemberConfigurationOptions) => any) |
                                                           ((opts: ISourceMemberConfigurationOptions, cb: IMemberCallback) => void)
                                        ): ICMChainFunc {
            // set defaults
            var ignore = false;
            var destinationProperty = sourceProperty;
            var async = false;

            if (typeof memberConfigFunc !== 'function') {
                throw new Error('Configuration of forSourceMember has to be a function with one options parameter.');
            }

            if (AutoMapperHelper.getFunctionParameters(memberConfigFunc).length <= 1) {
                var configFuncOptions = {
                    ignore: (): void => {
                        ignore = true;
                        destinationProperty = undefined;
                    }
                };
                (<(opts: ISourceMemberConfigurationOptions) => any>memberConfigFunc)(configFuncOptions);
            } else {
                async = true;
            }

            var memberMapping = mapping.forMemberMappings[sourceProperty];
            if (memberMapping) {
                if (ignore) {
                    memberMapping.ignore = true;
                    memberMapping.async = false;
                    memberMapping.mappingValuesAndFunctions = new Array<any>();
                } else {
                    memberMapping.async = async;
                    memberMapping.mappingValuesAndFunctions.push(memberConfigFunc);
                }
            } else {
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

            if (async ===  true) {
                mapping.async = true;
            }
            return toReturnFunctions;
        }

        /**
         * Customize configuration for all destination members.
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param toReturnFunctions The functions object to return to enable fluent layout behavior.
         * @param func The function to use for this individual member.
         * @returns {Core.IAutoMapperCreateMapChainingFunctions}
         */
        private createMapForAllMembers(mapping: IMapping,
                                       toReturnFunctions: ICMChainFunc,
                                       func: (destinationObject: any, destinationPropertyName: string, value: any) => void
                                      ): ICMChainFunc {
            mapping.forAllMemberMappings.push(func);
            return toReturnFunctions;
        }

        /**
         * Ignore all members not specified explicitly.
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param toReturnFunctions The functions object to return to enable fluent layout behavior.
         * @returns {Core.IAutoMapperCreateMapChainingFunctions}
         */
        private createMapIgnoreAllNonExisting(mapping: IMapping, toReturnFunctions: ICMChainFunc): ICMChainFunc {
            mapping.ignoreAllNonExisting = true;
            return toReturnFunctions;
        }

        /**
         * Specify to which class type AutoMapper should convert. When specified, AutoMapper will create an instance of the given type, instead of returning a new object literal.
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param toReturnFunctions The functions object to return to enable fluent layout behavior.
         * @param typeClass The destination type class.
         * @returns {Core.IAutoMapperCreateMapChainingFunctions}
         */
        private createMapConvertToType(mapping: IMapping,
                                       toReturnFunctions: ICMChainFunc,
                                       typeClass: new () => any): ICMChainFunc {
            if (mapping.destinationTypeClass) {
                if (mapping.destinationTypeClass === typeClass) {
                    return toReturnFunctions;
                }

                throw new Error('Destination type class can only be set once.');
            }

            mapping.destinationTypeClass = typeClass;
            return toReturnFunctions;
        }

        /**
         * Skip normal member mapping and convert using a custom type converter (instantiated during mapping).
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param typeConverterClassOrFunction The converter class or function to use when converting.
         */
        private createMapConvertUsing(mapping: IMapping,
                                      typeConverterClassOrFunction: ((resolutionContext: IResolutionContext) => any) |
                                                                    ((resolutionContext: IResolutionContext, callback: IMapCallback) => void) |
                                                                    TypeConverter |
                                                                    (new() => TypeConverter)): void {
            var typeConverterFunction: (resolutionContext: IResolutionContext) => any;

            var functionParameters = AutoMapperHelper.getFunctionParameters(<any>typeConverterClassOrFunction);

            // 1. check if a function with one parameter is provided; if so, assume it to be the convert function.
            // 2. check if an instance of TypeConverter is provided; in that case, there will be a convert function.
            // 3. assume we are dealing with a class definition, instantiate it and store its convert function.
            // [4. okay, really? the dev providing typeConverterClassOrFunction appears to be an idiot - fire him/her :P .]
            var async = false;
            try {
                if (typeConverterClassOrFunction instanceof TypeConverter) {
                    typeConverterFunction = typeConverterClassOrFunction.convert;
                } else if (functionParameters.length === 2) { // async: resolutionContext, callback
                    async = true;
                } else if (functionParameters.length === 1) { // sync: resolutionContext
                    typeConverterFunction = <(resolutionContext: IResolutionContext) => any>typeConverterClassOrFunction;
                } else {
                    // ReSharper disable InconsistentNaming
                    typeConverterFunction = (<TypeConverter>new (<new() => TypeConverter>typeConverterClassOrFunction)()).convert;
                    // ReSharper restore InconsistentNaming
                }
            } catch (e) {
                throw new Error(`The value provided for typeConverterClassOrFunction is invalid. Exception: ${e}`);
            }

            if (async) {
                this.asyncAutoMapper.createMapConvertUsing(mapping, <(ctx: IResolutionContext, cb: IMapCallback) => void>typeConverterClassOrFunction);
            } else {
                if (!typeConverterFunction || AutoMapperHelper.getFunctionParameters(typeConverterFunction).length !== 1) {
                    throw new Error('The value provided for typeConverterClassOrFunction is invalid, because it does not provide exactly one (resolutionContext) parameter.');
                }

                mapping.typeConverterFunction = <(resolutionContext: IResolutionContext) => any>typeConverterFunction;
                mapping.mapItemFunction = (m: IMapping, srcObj: any, dstObj: any): any => this.mapItemUsingTypeConverter(m, srcObj, dstObj);
            }
        }

        /**
         * Assign a profile to the current type map. 
         * @param {IMapping} mapping The mapping configuration for the current mapping keys/types.
         * @param {string} profileName The profile name of the profile to assign.
         */
        private createMapWithProfile(mapping: IMapping, profileName: string): void {
            // check if given profile exists
            var profile = this.profiles[profileName];
            if (typeof profile === 'undefined' || profile.profileName !== profileName) {
                throw new Error(`Could not find profile with profile name '${profileName}'.`);
            }

            mapping.profile = profile;
            // merge mappings
            this.createMapWithProfileMergeMappings(mapping, profileName);
        }

        /**
         * Merge original mapping object with the assigned profile's mapping object.
         * @param {IMapping} mapping The mapping configuration for the current mapping keys/types.
         * @param {string} profileName The profile name of the profile to assign.
         */
        private createMapWithProfileMergeMappings(mapping: IMapping,
                                     profileName: string): void {

            var profileMappingKey = `${profileName}=>${mapping.sourceKey}${profileName}=>${mapping.destinationKey}`;
            var profileMapping: IMapping = this.mappings[profileMappingKey];
            if (!profileMapping) {
                return;
            }

            // append forAllMemberMappings calls to the original array.
            if (profileMapping.forAllMemberMappings.length > 0) {
                mapping.forAllMemberMappings.push(...profileMapping.forAllMemberMappings);
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
            for (let propertyName in profileMapping.forMemberMappings) {
                if (!profileMapping.forMemberMappings.hasOwnProperty(propertyName)) {
                    continue;
                }

                let profilePropertyMapping = profileMapping.forMemberMappings[propertyName];

                // try to find an existing mapping for this property mapping
                let existingPropertyMapping = this.createMapForMemberFindMember(mapping, profilePropertyMapping.destinationProperty);
                if (existingPropertyMapping) {
                    // in which case, we overwrite that one with the profile's property mapping.
                    // okay, maybe a bit rude, but real merging is pretty complex and you should
                    // probably not want to combine normal and profile createMap.forMember calls.
                    delete mapping.forMemberMappings[existingPropertyMapping.sourceProperty];
                    mapping.forMemberMappings[profilePropertyMapping.sourceProperty] = profilePropertyMapping;
                }
            }
        }

        private mapInternal(mapping: IMapping, sourceObject: any): any {
            // TODO handle synchronize async mapping (?)
            if (mapping.async) {
                throw new Error('Impossible to use asynchronous mapping using automapper.map(); use automapper.mapAsync() instead.');
//                 var result: any;
//                 var handled = false;
// 
//                 this.asyncAutoMapper.mapWithMapping(mapping, sourceObject, (res: any) => {
//                     result = res;
//                     handled = true;
//                 });
// 
//                 var synchronize = (timeoutMs: number = 0): void => {
//                     if (!handled) {
//                         window.setInterval((): void => {
//                             synchronize(timeoutMs + 50);
//                         }, timeoutMs);
//                     }
//                 };
// 
//                 synchronize();
//                 return result;
            }

            if (super.isArray(sourceObject)) {
                return this.mapArray(mapping, sourceObject);
            }

            return (<IMapItemFunction>mapping.mapItemFunction)(mapping, sourceObject, super.createDestinationObject(mapping.destinationTypeClass));
        }

        /**
         * Execute a mapping from the source array to a new destination array with explicit mapping configuration and supplied mapping options (using createMap).
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param sourceArray The source array to map.
         * @returns {Array<any>} Destination array.
         */
        private mapArray(mapping: IMapping, sourceArray: Array<any>): Array<any> {
            var destinationArray = super.handleArray(mapping, sourceArray, (sourceObject: any, destinationObject: any) => {
                (<IMapItemFunction>mapping.mapItemFunction)(mapping, sourceObject, destinationObject);
            });
            return destinationArray;
        }

        /**
         * Execute a mapping from the source object to a new destination object with explicit mapping configuration and supplied mapping options (using createMap).
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param sourceObject The source object to map.
         * @param destinationObject The destination object to map to.
         * @param arrayIndex The array index number, if this is an array being mapped.
         */
        private mapItem(mapping: IMapping, sourceObject: any, destinationObject: any): void {
            super.handleItem(mapping, sourceObject, destinationObject, (propertyName: string) => {
                this.mapProperty(mapping, sourceObject, destinationObject, propertyName);
            });
            return destinationObject;
        }

        /**
         * Execute a mapping from the source object to a new destination object with explicit mapping configuration and supplied mapping options (using createMap).
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param sourceObject The source object to map.
         * @param arrayIndex The array index number, if this is an array being mapped.
         * @returns {any} Destination object.
         */
        private mapItemUsingTypeConverter(mapping: IMapping, sourceObject: any, destinationObject: any, arrayIndex?: number): void {
            var resolutionContext: IResolutionContext = {
                sourceValue: sourceObject,
                destinationValue: destinationObject
            };
            return (<(ctx: IResolutionContext) => any>mapping.typeConverterFunction)(resolutionContext);
        }

        /**
         * Execute a mapping from the source object property to the destination object property with explicit mapping configuration and supplied mapping options.
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param sourceObject The source object to map.
         * @param sourceProperty The source property to map.
         * @param destinationObject The destination object to map to.
         */
        private mapProperty(mapping: IMapping, sourceObject: any, destinationObject: any, sourceProperty: string): void {
            super.handleProperty(mapping, sourceObject, sourceProperty, destinationObject,
                (destinationProperty: string, valuesAndFunctions: Array<any>, opts: IMemberConfigurationOptions) => {
                    var destinationPropertyValue = this.handlePropertyMappings(valuesAndFunctions, opts);
                    super.setPropertyValue(mapping, destinationObject, destinationProperty, destinationPropertyValue);
                });
        }

        private handlePropertyMappings(valuesAndFunctions: Array<any>, opts: IMemberConfigurationOptions): any {
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
            } else {
                // valueOrFunction is a value
                opts.intermediatePropertyValue = valueOrFunction;

                // recursively walk values/functions
                return this.handlePropertyMappings(valuesAndFunctions.slice(1), opts);
            }
        }
    }
}

// Add AutoMapper to the application's global scope. Of course, you could still use Core.AutoMapper.getInstance() as well.
var automapper: AutoMapperJs.AutoMapper = ((app: any) => {
    app.automapper = AutoMapperJs.AutoMapper.getInstance();
    return app.automapper;
})(this);