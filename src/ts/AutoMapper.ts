/// <reference path="../../dist/arcady-automapper-interfaces.d.ts" />
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
    export class AutoMapper {
        private static instance = new AutoMapper();

        private profiles: { [name: string]: IProfile };
        private mappings: { [key: string]: IMapping };

        /**
         * Creates a new AutoMapper instance. This class is intended to be a Singleton.
         * Do not use the constructor directly from code. Use getInstance() function instead.
         * @constructor
         */
        constructor() {
            if (AutoMapper.instance) {
                throw new Error('Instantiation failed: Use getInstance() function instead of constructor function.');
            }
            AutoMapper.instance = this;

            this.profiles = {};
            this.mappings = {};
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
            if (arguments.length < 2) { // this.createMap.length) {
                return AutoMapperHelper.handleCurrying(this.createMap, arguments, this);
            }

            var sourceKey = this.getKey(sourceKeyOrType);
            var destinationKey = this.getKey(destinationKeyOrType);

            var mappingKey = sourceKey + destinationKey;

            // create a mapping object for the given keys
            var mapping: IMapping = {
                sourceKey: sourceKey,
                destinationKey: destinationKey,
                forAllMemberMappings: new Array<(destinationObject: any, destinationPropertyName: string, value: any) => void>(),
                forMemberMappings: {},
                typeConverterFunction: undefined,
                mapItemFunction: this.mapItem,
                sourceTypeClass: (typeof sourceKeyOrType === 'string' ? undefined : sourceKeyOrType),
                destinationTypeClass: (typeof destinationKeyOrType === 'string' ? undefined : destinationKeyOrType),
                profile: undefined
            };
            this.mappings[mappingKey] = mapping;

            // return an object with available 'sub' functions to create a fluent interface / method chaining 
            // (e.g. automapper.createMap().forMember().forMember() ...)
            var fluentApiFuncs: ICMChainFunc = {
                forMember: (destinationProperty: string, valueOrFunction: any|((opts: IMemberConfigurationOptions) => any)) : ICMChainFunc =>
                    this.createMapForMember(mapping, fluentApiFuncs, destinationProperty, valueOrFunction),
                forSourceMember: (sourceProperty: string, configFunction: (opts: ISourceMemberConfigurationOptions) => void) : ICMChainFunc =>
                    this.createMapForSourceMember(mapping, fluentApiFuncs, sourceProperty, configFunction),
                forAllMembers: (func: (destinationObject: any, destinationPropertyName: string, value: any) => void) : ICMChainFunc =>
                    this.createMapForAllMembers(mapping, fluentApiFuncs, func),
                ignoreAllNonExisting: () : ICMChainFunc =>
                    this.createMapIgnoreAllNonExisting(mapping, fluentApiFuncs),
                convertToType: (typeClass: new () => any) : ICMChainFunc =>
                    this.createMapConvertToType(mapping, fluentApiFuncs, typeClass),
                convertUsing: (typeConverterClassOrFunction: ((resolutionContext: IResolutionContext) => any)|TypeConverter|(new() => TypeConverter)) : void =>
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
                let sourceKey = this.getKey(sourceKeyOrType);
                let destinationKey = this.getKey(destinationKeyOrType);
                let mapping: IMapping = this.mappings[sourceKey + destinationKey];

                if (!mapping) {
                    throw new Error(`Could not find map object with a source of ${sourceKey} and a destination of ${destinationKey}`);
                }

                return this.mapInternal(mapping, sourceObject);
            }

            // provide performance optimized (preloading) currying support.
            if (arguments.length === 2) {
                let sourceKey = this.getKey(sourceKeyOrType);
                let destinationKey = this.getKey(destinationKeyOrType);
                let mapping: IMapping = this.mappings[sourceKey + destinationKey];
                return (srcObj: any) => this.mapInternal(mapping, srcObj);
            }

            if (arguments.length === 1) {
                return (dstKey: string | (new() => any), srcObj: any) => this.map(sourceKeyOrType, dstKey, srcObj);
            }

            return (srcKey: string | (new() => any), dstKey: string | (new() => any), srcObj: any) => this.map(srcKey, dstKey, srcObj);
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

        private createMapForMemberHandleMappingFunction(mapping: IMapping, memberMapping: IForMemberMapping, mappingFunction: (opts: IMemberConfigurationOptions) => any): void {
            var addMappingValueOrFunction = true;

            // Since we are calling the valueOrFunction function to determine whether to ignore or map from another property, we
            // want to prevent the call to be error prone when the end user uses the '(opts)=> opts.sourceObject.sourcePropertyName'
            // syntax. We don't actually have a source object when creating a mapping; therefore, we 'stub' a source object for the
            // function call.
            var sourceObject: any = {};
            sourceObject[memberMapping.sourceProperty] = {};

            const destMemberConfigFunctionOptions: IMemberConfigurationOptions = {
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
                destinationPropertyValue: {}
            };

            try {
                // calling the function will result in calling our stubbed ignore() and mapFrom() functions if used inside the function.
                mappingFunction(destMemberConfigFunctionOptions);
            } catch (err) {
                // not foreseeable, but no problem at all (possible by design, like with the opts.condition() and mappingValuesAndFunctions 
                // methods). We have to catch all potential errors from calling the function, since we cannot predict which goals the end 
                // user tries do reach with the stubbed sourceObject property.
            }

            if (addMappingValueOrFunction) {
                memberMapping.mappingValuesAndFunctions.push(mappingFunction);
            }
        }

        /**
         * Customize configuration for an individual source member.
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param toReturnFunctions The functions object to return to enable fluent layout behavior.
         * @param sourceProperty The source member property name.
         * @param sourceMemberConfigFunction The function to use for this individual member.
         * @returns {Core.IAutoMapperCreateMapChainingFunctions}
         */
        private createMapForSourceMember(mapping: IMapping,
                                         toReturnFunctions: ICMChainFunc,
                                         sourceProperty: string,
                                         sourceMemberConfigFunction: (opts: ISourceMemberConfigurationOptions) => void): ICMChainFunc {
            // set defaults
            var ignore = false;
            var destinationProperty = sourceProperty;

            if (typeof sourceMemberConfigFunction !== 'function') {
                throw new Error('Configuration of forSourceMember has to be a function with one options parameter.');
            }

            var sourceMemberConfigFunctionOptions = {
                ignore: (): void => {
                    ignore = true;
                    destinationProperty = undefined;
                }
            };

            sourceMemberConfigFunction(sourceMemberConfigFunctionOptions);

            var memberMapping = mapping.forMemberMappings[sourceProperty];
            if (memberMapping) {
                if (ignore) {
                    memberMapping.ignore = true;
                    memberMapping.mappingValuesAndFunctions = new Array<any>();
                } else {
                    memberMapping.mappingValuesAndFunctions.push(sourceMemberConfigFunction);
                }
            } else {
                mapping.forMemberMappings[sourceProperty] = {
                    sourceProperty: sourceProperty,
                    destinationProperty: destinationProperty,
                    sourceMapping: true,
                    mappingValuesAndFunctions: [sourceMemberConfigFunction],
                    ignore: ignore,
                    conditionFunction: undefined
                };
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
                                                                     TypeConverter |
                                                                     (new() => TypeConverter)): void {
            var typeConverterFunction: (resolutionContext: IResolutionContext) => any;

            // 1. check if a function with one parameter is provided; if so, assume it to be the convert function.
            // 2. check if an instance of TypeConverter is provided; in that case, there will be a convert function.
            // 3. assume we are dealing with a class definition, instantiate it and store its convert function.
            // [4. okay, really? the dev providing typeConverterClassOrFunction appears to be an idiot - fire him/her :P .]
            try {
                if (typeConverterClassOrFunction instanceof TypeConverter) {
                    typeConverterFunction = typeConverterClassOrFunction.convert;
                } else if (AutoMapperHelper.getFunctionParameters(<(resolutionContext: IResolutionContext) => any>typeConverterClassOrFunction).length === 1) {
                    typeConverterFunction = <(resolutionContext: IResolutionContext) => any>typeConverterClassOrFunction;
                } else {
                    // ReSharper disable InconsistentNaming
                    typeConverterFunction = (<TypeConverter>new (<new() => TypeConverter>typeConverterClassOrFunction)()).convert;
                    // ReSharper restore InconsistentNaming
                }
            } catch (e) {
                throw new Error(`The value provided for typeConverterClassOrFunction is invalid. Exception: ${e}`);
            }

            if (!typeConverterFunction || AutoMapperHelper.getFunctionParameters(typeConverterFunction).length !== 1) {
                throw new Error('The value provided for typeConverterClassOrFunction is invalid, because it does not provide exactly one (resolutionContext) parameter.');
            }

            mapping.typeConverterFunction = <(resolutionContext: IResolutionContext) => any>typeConverterFunction;
            mapping.mapItemFunction = this.mapItemUsingTypeConverter;
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
             if (sourceObject instanceof Array) {
                 return this.mapArray(mapping, sourceObject);
             }

             return mapping.mapItemFunction.call(this, mapping, sourceObject);
        }

        /**
         * Execute a mapping from the source array to a new destination array with explicit mapping configuration and supplied mapping options (using createMap).
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param sourceArray The source array to map.
         * @returns {Array<any>} Destination array.
         */
        private mapArray(mapping: IMapping, sourceArray: Array<any>): Array<any> {
            // create empty destination array.
            var destinationArray = new Array<any>();

            for (let index = 0, length = sourceArray.length; index < length; index++) {
                let sourceObject = sourceArray[index];

                let destinationObject = mapping.mapItemFunction.call(this, mapping, sourceObject, index);
                if (destinationObject) {
                    destinationArray.push(destinationObject);
                }
            }

            return destinationArray;
        }

        /**
         * Execute a mapping from the source object to a new destination object with explicit mapping configuration and supplied mapping options (using createMap).
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param sourceObject The source object to map.
         * @param arrayIndex The array index number, if this is an array being mapped.
         * @returns {any} Destination object.
         */
        private mapItem(mapping: IMapping, sourceObject: any, arrayIndex?: number): any {
            var destinationObject = this.mapItemCreateDestinationObject(mapping.destinationTypeClass);

            for (let sourcePropertyName in sourceObject) {
                if (!sourceObject.hasOwnProperty(sourcePropertyName)) {
                    continue;
                }

                this.mapProperty(mapping, sourceObject, sourcePropertyName, destinationObject);
            }

            return destinationObject;
        }

        /**
         * Execute a mapping from the source object to a new destination object with explicit mapping configuration and supplied mapping options (using createMap).
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param sourceObject The source object to map.
         * @param arrayIndex The array index number, if this is an array being mapped.
         * @returns {any} Destination object.
         */
        private mapItemUsingTypeConverter(mapping: IMapping, sourceObject: any, arrayIndex?: number): any {
            var destinationObject = this.mapItemCreateDestinationObject(mapping.destinationTypeClass);

            var resolutionContext: IResolutionContext = {
                sourceValue: sourceObject,
                destinationValue: destinationObject
            };
            return mapping.typeConverterFunction(resolutionContext);
        }

        private mapItemCreateDestinationObject(destinationTypeClass: new() => any): any {
            // create empty destination object.
            return destinationTypeClass
                ? new destinationTypeClass()
                : {};
        }

        /**
         * Execute a mapping from the source object property to the destination object property with explicit mapping configuration and supplied mapping options.
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param sourceObject The source object to map.
         * @param sourcePropertyName The source property to map.
         * @param destinationObject The destination object to map to.
         */
        private mapProperty(mapping: IMapping, sourceObject: any, sourcePropertyName: string, destinationObject: any): void {
            var propertyMapping = mapping.forMemberMappings[sourcePropertyName];
            if (propertyMapping) {
                // a forMember mapping exists

                var {
                    ignore,
                    conditionFunction,
                    destinationProperty,
                    mappingValuesAndFunctions
                } = propertyMapping;

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

                var memberConfigurationOptions: IMemberConfigurationOptions = {
                    mapFrom: (): void => {//sourceMemberKey: string) {
                        // no action required, just here as a stub to prevent calling a non-existing 'opts.mapFrom()' function.
                    },
                    condition: (predicate: ((sourceObject: any) => boolean)): void => {
                        // no action required, just here as a stub to prevent calling a non-existing 'opts.mapFrom()' function.
                    },
                    sourceObject: sourceObject,
                    sourcePropertyName: sourcePropertyName,
                    destinationPropertyValue: sourceObject[sourcePropertyName]
                };

                for (let mappingValueOrFunction of mappingValuesAndFunctions) {
                    let destinationPropertyValue: any;

                    if (typeof mappingValueOrFunction === 'function') {
                        destinationPropertyValue = mappingValueOrFunction(memberConfigurationOptions);
                        if (typeof destinationPropertyValue === 'undefined') {
                            destinationPropertyValue = memberConfigurationOptions.destinationPropertyValue;
                        }
                    } else {
                        // mappingValueOrFunction is a value
                        destinationPropertyValue = mappingValueOrFunction;
                    }

                    memberConfigurationOptions.destinationPropertyValue = destinationPropertyValue;
                }

                this.mapSetValue(mapping, destinationObject, propertyMapping.destinationProperty, memberConfigurationOptions.destinationPropertyValue);
            } else {
                // no forMember mapping exists, auto map properties ...

                // ... except for the situation where ignoreAllNonExisting is specified.
                if (mapping.ignoreAllNonExisting) {
                    return;
                }

                // use profile mapping when specified; otherwise, specify source property name as destination property name.
                let destinationPropertyName: string;
                if (mapping.profile) {
                    destinationPropertyName = this.mapGetDestinationPropertyName(mapping.profile, sourcePropertyName);
                } else {
                    destinationPropertyName = sourcePropertyName;
                }

                this.mapSetValue(mapping, destinationObject, destinationPropertyName, sourceObject[sourcePropertyName]);
            }
        }

        private mapGetDestinationPropertyName(profile: IProfile, sourcePropertyName: string): string {
            // TODO BL no support yet for INamingConvention.splittingCharacter

            try {
                // First, split the source property name based on the splitting expression.
                // TODO BL Caching of RegExp splitting!
                var sourcePropertyNameParts = sourcePropertyName.split(profile.sourceMemberNamingConvention.splittingExpression);

                // NOTE BL For some reason, splitting by (my ;)) RegExp results in empty strings in the array; remove them.
                for (let index = sourcePropertyNameParts.length - 1; index >= 0; index--) {
                    if (sourcePropertyNameParts[index] === '') {
                        sourcePropertyNameParts.splice(index, 1);
                    }
                }

                return profile.destinationMemberNamingConvention.transformPropertyName(sourcePropertyNameParts);
            } catch (error) {
                return sourcePropertyName;
            }
        }

        /**
         * Set the mapped value on the destination object, either direct or via the (optionally) supplied forAllMembers function(s).
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param propertyMapping The mapping property configuration for the current property.
         * @param destinationObject The destination object to map to.
         * @param destinationPropertyValue The destination value.
         */
        private mapSetValue(mapping: IMapping, destinationObject: any, destinationPropertyName: string, destinationPropertyValue: any): void {
            if (mapping.forAllMemberMappings.length > 0) {
                for (let forAllMemberMapping of mapping.forAllMemberMappings) {
                    forAllMemberMapping(destinationObject, destinationPropertyName, destinationPropertyValue);
                }
            } else {
                destinationObject[destinationPropertyName] = destinationPropertyValue;
            }
        }

        private getKey(keyStringOrType: string | (new() => any)): string {
            if (typeof keyStringOrType === 'string') {
                return keyStringOrType;
            } else {
                return AutoMapperHelper.getClassName(keyStringOrType);
            }
        }
    }
}

// Add AutoMapper to the application's global scope. Of course, you could still use Core.AutoMapper.getInstance() as well.
var automapper: AutoMapperJs.AutoMapper = ((app: any) => {
    app.automapper = AutoMapperJs.AutoMapper.getInstance();
    return app.automapper;
})(this);