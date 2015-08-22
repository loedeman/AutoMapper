﻿/// <reference path="TypeConverter.ts" />
/// <reference path="../../tools/typings/arcady-automapper.d.ts" />

module AutoMapperJs {
    'use strict';

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
        public static getInstance(): IAutoMapper {
            // NOTE BL The ugly conversion to any and IAutoMapper is needed since
            //         AutoMapper and IAutoMapper are not 100% compatible because
            //         of currying support; the IAutoMapper interface, however, is
            //         in fact a 100% functional representation of AutoMapper ;) . 
            return <AutoMapperJs.IAutoMapper>(<any>AutoMapper.instance);
        }

        public initialize(configFunction: (config: IConfiguration) => void) {
            var that = this;

            var configuration: IConfiguration = {
                addProfile: (profile: IProfile) => {
                    that.profiles[profile.profileName] = profile;
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
        public createMap(sourceKey: string, destinationKey: string): IAutoMapperCreateMapChainingFunctions {
            // provide currying support.
            if (arguments.length < this.createMap.length) {
                return this.handleCurrying(this.createMap, arguments, this);
            }

            var mappingKey = sourceKey + destinationKey;

            // create a mapping object for the given keys
            var mapping: IMapping = {
                key: mappingKey,
                forAllMemberMappings: new Array<(destinationObject: any, destinationPropertyName: string, value: any) => void>(),
                forMemberMappings: {},
                typeConverterFunction: undefined,
                destinationTypeClass: undefined,
                profile: undefined
            };
            this.mappings[mappingKey] = mapping;

            // return an object with available 'sub' functions to enable method chaining 
            // (e.g. automapper.createMap().forMember().forMember() ...)
            var fluentApiFuncs: IAutoMapperCreateMapChainingFunctions = {
                forMember: (destinationProperty: string, valueOrFunction: any) =>
                    this.createMapForMember(mapping, fluentApiFuncs, destinationProperty, valueOrFunction),
                forSourceMember: (sourceProperty: string, sourceMemberConfigurationFunction: (opts: ISourceMemberConfigurationOptions) => void) =>
                    this.createMapForSourceMember(mapping, fluentApiFuncs, sourceProperty, sourceMemberConfigurationFunction),
                forAllMembers: (func: (destinationObject: any, destinationPropertyName: string, value: any) => void) =>
                    this.createMapForAllMembers(mapping, fluentApiFuncs, func),
                convertToType: (typeClass: new () => any) =>
                    this.createMapConvertToType(mapping, fluentApiFuncs, typeClass),
                convertUsing: (typeConverterClassOrFunction: any) =>
                    this.createMapConvertUsing(mapping, typeConverterClassOrFunction),
                withProfile: (profileName: string) => this.createMapWithProfile(mapping, fluentApiFuncs, profileName)
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
        public map(sourceKey: string, destinationKey: string, sourceObject: any): any {
            // provide currying support.
            if (arguments.length < this.map.length) {
                return this.handleCurrying(this.map, arguments, this);
            }

            var mappingKey = sourceKey + destinationKey;
            var mapping: IMapping = this.mappings[mappingKey];
            if (!mapping) {
                throw new Error(`Could not find map object with a source of ${sourceKey} and a destination of ${destinationKey}`);
            }

            if (sourceObject instanceof Array) {
                return this.mapArray(mapping, sourceObject);
            }

            return this.mapItem(mapping, sourceObject);
        }

        /**
         * Customize configuration for an individual destination member.
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param toReturnFunctions The functions object to return to enable fluent layout behavior.
         * @param sourceProperty The destination member property name.
         * @param valueOrFunction The value or function to use for this individual member.
         * @returns {Core.IAutoMapperCreateMapChainingFunctions}
         */
        private createMapForMember(mapping: IMapping,
                                   toReturnFunctions: IAutoMapperCreateMapChainingFunctions,
                                   destinationProperty: string,
                                   valueOrFunction: any): IAutoMapperCreateMapChainingFunctions {
            // find existing mapping for member
            var originalSourcePropertyName: string = undefined;
            var memberMapping = this.createMapForMemberFindMember(mapping, destinationProperty);
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
                    mappingValuesAndFunctions: new Array<any>(),
                    ignore: false
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

        private createMapForMemberFindMember(mapping: IMapping, destinationPropertyName: string): IForMemberMapping {
            for (let property in mapping.forMemberMappings) {
                if (!mapping.forMemberMappings.hasOwnProperty(property)) {
                    continue;
                }

                var memberMapping = mapping.forMemberMappings[property];

                if (memberMapping.destinationProperty === destinationPropertyName) {
                    return mapping.forMemberMappings[property];
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

            const destinationMemberConfigurationFunctionOptions: IMemberConfigurationOptions = {
                ignore() {
                    // an ignored member effectively has no mapping values / functions. Remove potentially existing values / functions.
                    memberMapping.ignore = true;
                    memberMapping.sourceProperty = memberMapping.destinationProperty; // in case someone really tried mapFrom before.
                    memberMapping.mappingValuesAndFunctions = new Array<any>();
                    addMappingValueOrFunction = false;
                },
                mapFrom(sourcePropertyName: string) {
                    memberMapping.sourceProperty = sourcePropertyName;
                },
                sourceObject: sourceObject,
                sourcePropertyName: memberMapping.sourceProperty,
                destinationPropertyValue: {}
            };

            try {
                // calling the function will result in calling our stubbed ignore() and mapFrom() functions if used inside the function.
                mappingFunction(destinationMemberConfigurationFunctionOptions);
            } catch (err) {
                // not foreseeable, but no problem at all (possible by design). We have to catch all potential errors from calling
                // the function, since we cannot predict which goals the end user tries do reach with the stubbed sourceObject property.
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
         * @param sourceMemberConfigurationFunction The function to use for this individual member.
         * @returns {Core.IAutoMapperCreateMapChainingFunctions}
         */
        private createMapForSourceMember(mapping: IMapping,
                                         toReturnFunctions: IAutoMapperCreateMapChainingFunctions,
                                         sourceProperty: string,
                                         sourceMemberConfigurationFunction: (opts: ISourceMemberConfigurationOptions) => void): IAutoMapperCreateMapChainingFunctions {
            // set defaults
            var ignore = false;
            var destinationProperty = sourceProperty;

            if (typeof sourceMemberConfigurationFunction !== 'function') {
                throw new Error('Configuration of forSourceMember has to be a function with one options parameter.');
            }

            var sourceMemberConfigurationFunctionOptions = {
                ignore() {
                    ignore = true;
                    destinationProperty = undefined;
                }
            };

            sourceMemberConfigurationFunction(sourceMemberConfigurationFunctionOptions);

            var memberMapping = mapping.forMemberMappings[sourceProperty];
            if (memberMapping) {
                if (ignore) {
                    memberMapping.ignore = true;
                    memberMapping.mappingValuesAndFunctions = new Array<any>();
                } else {
                    memberMapping.mappingValuesAndFunctions.push(sourceMemberConfigurationFunction);
                }
            } else {
                mapping.forMemberMappings[sourceProperty] = {
                    sourceProperty: sourceProperty,
                    destinationProperty: destinationProperty,
                    mappingValuesAndFunctions: [sourceMemberConfigurationFunction],
                    ignore: ignore
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
                                       toReturnFunctions: IAutoMapperCreateMapChainingFunctions,
                                       func: (destinationObject: any,
                                       destinationPropertyName: string, value: any) => void): IAutoMapperCreateMapChainingFunctions {
            mapping.forAllMemberMappings.push(func);
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
                                       toReturnFunctions: IAutoMapperCreateMapChainingFunctions,
                                       typeClass: new () => any): IAutoMapperCreateMapChainingFunctions {
            mapping.destinationTypeClass = typeClass;
            return toReturnFunctions;
        }

        /**
         * Skip normal member mapping and convert using a custom type converter (instantiated during mapping).
         * @param mapping The mapping configuration for the current mapping keys/types.
         * @param typeConverterClassOrFunction The converter class or function to use when converting.
         */
        private createMapConvertUsing(mapping: IMapping, typeConverterClassOrFunction: any): void {
            var typeConverterFunction: Function;

            // 1. check if a function with one parameter is provided; if so, assume it to be the convert function.
            // 2. check if an instance of TypeConverter is provided; in that case, there will be a convert function.
            // 3. assume we are dealing with a class definition, instantiate it and store its convert function.
            // [4. okay, really? the dev providing typeConverterClassOrFunction appears to be an idiot - fire him/her :P .]
            try {
                if (this.getFunctionParameters(typeConverterClassOrFunction).length === 1) {
                    typeConverterFunction = typeConverterClassOrFunction;
                } else if (typeConverterClassOrFunction instanceof TypeConverter) {
                    typeConverterFunction = (<TypeConverter>typeConverterClassOrFunction).convert;
                } else {
                    // ReSharper disable InconsistentNaming
                    typeConverterFunction = (<TypeConverter>new typeConverterClassOrFunction()).convert;
                    // ReSharper restore InconsistentNaming
                }
            } catch (e) {
                throw new Error(`The value provided for typeConverterClassOrFunction is invalid. Exception: ${e}`);
            }

            if (!typeConverterFunction || this.getFunctionParameters(typeConverterFunction).length !== 1) {
                throw new Error('The value provided for typeConverterClassOrFunction is invalid, because it does not provide exactly one (resolutionContext) parameter.');
            }

            mapping.typeConverterFunction = <(resolutionContext: IResolutionContext) => any>typeConverterFunction;
        }

        private createMapWithProfile(mapping: IMapping,
                                     toReturnFunctions: IAutoMapperCreateMapChainingFunctions,
                                     profileName: string): IAutoMapperCreateMapChainingFunctions {
            // check if given profile exists
            var profile = this.profiles[profileName];
            if (typeof profile === 'undefined' || profile.profileName !== profileName) {
                throw new Error(`Could not find profile with profile name '${profileName}'.`);
            }

            mapping.profile = profile;

            return toReturnFunctions;
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

            for (var index = 0, length = sourceArray.length; index < length; index++) {
                var sourceObject = sourceArray[index];

                var destinationObject = this.mapItem(mapping, sourceObject, index);
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
        private mapItem(mapping: IMapping, sourceObject: any, arrayIndex: number = undefined): any {
            // create empty destination object.
            // ReSharper disable InconsistentNaming
            var destinationObject = mapping.destinationTypeClass
                ? new mapping.destinationTypeClass()
                : {};
            // ReSharper restore InconsistentNaming

            if (mapping.typeConverterFunction) {
                var resolutionContext: IResolutionContext = {
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

                // ignore ignored properties
                if (propertyMapping.ignore) {
                    return;
                }

                var memberConfigurationOptions: IMemberConfigurationOptions = {
                    mapFrom() {//sourceMemberKey: string) {
                        // no action required, just here as a stub to prevent calling a non-existing 'opts.mapFrom()' function.
                    },
                    ignore() {
                        // no action required, just here as a stub to prevent calling a non-existing 'opts.ignore()' function.
                    },
                    sourceObject: sourceObject,
                    sourcePropertyName: sourcePropertyName,
                    destinationPropertyValue: sourceObject[sourcePropertyName]
                };

                for (var index = 0, length = propertyMapping.mappingValuesAndFunctions.length; index < length; index++) {
                    var mappingValueOrFunction = propertyMapping.mappingValuesAndFunctions[index];
                    var destinationPropertyValue: any;

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
                // no forMember mapping exists, auto map properties.

                // use profile mapping when specified; otherwise, specify source property name as destination property name.
                var destinationPropertyName: string;
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
                for (var index = sourcePropertyNameParts.length - 1; index >= 0; index--) {
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
                for (var i = 0; i < mapping.forAllMemberMappings.length; i++) {
                    mapping.forAllMemberMappings[i](destinationObject, destinationPropertyName, destinationPropertyValue);
                }
            } else {
                destinationObject[destinationPropertyName] = destinationPropertyValue;
            }
        }

        // TODO BL Perhaps move to separate utility class?
        private getFunctionParameters(func: Function): Array<string> {
            const stripComments = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
            const argumentNames = /([^\s,]+)/g;

            var functionString = func.toString().replace(stripComments, '');
            var functionParameterNames = functionString.slice(functionString.indexOf('(') + 1, functionString.indexOf(')')).match(argumentNames);
            if (functionParameterNames === null) {
                functionParameterNames = new Array<string>();
            }
            return functionParameterNames;
        }

        // TODO BL Perhaps move to separate utility class?
        // TODO BL Document (src: http://www.crockford.com/javascript/www_svendtofte_com/code/curried_javascript/index.html)
        private handleCurrying(func: Function, args: IArguments, closure: any): any {
            const argumentsStillToCome = func.length - args.length;

            // saved accumulator array
            // NOTE BL this does not deep copy array objects, but only copy the array itself; when side effects occur, please report (or refactor).
            var argumentsCopy = Array.prototype.slice.apply(args);

            function accumulator(moreArgs: IArguments, alreadyProvidedArgs: Array<any>, stillToCome: number) {
                var previousAlreadyProvidedArgs = alreadyProvidedArgs.slice(0); // to reset
                var previousStillToCome = stillToCome; // to reset

                for (let i = 0; i < moreArgs.length; i++, stillToCome--) {
                    alreadyProvidedArgs[alreadyProvidedArgs.length] = moreArgs[i];
                }

                if (stillToCome - moreArgs.length <= 0) {
                    var functionCallResult = func.apply(closure, alreadyProvidedArgs);

                    // reset vars, so curried function can be applied to new params.
                    // ReSharper disable AssignedValueIsNeverUsed
                    alreadyProvidedArgs = previousAlreadyProvidedArgs;
                    stillToCome = previousStillToCome;
                    // ReSharper restore AssignedValueIsNeverUsed

                    return functionCallResult;
                } else {
                    // ReSharper disable Lambda
                    return function() {
                        // arguments are params, so closure bussiness is avoided.
                        return accumulator(arguments, alreadyProvidedArgs.slice(0), stillToCome);
                    };
                    // ReSharper restore Lambda
                }
            }

            return accumulator(<IArguments>(<any>[]), argumentsCopy, argumentsStillToCome);
        }
    }
}

// Add AutoMapper to the application's global scope. Of course, you could still use 
// Core.AutoMapper.getInstance() as well.
var automapper: AutoMapperJs.IAutoMapper = ((app: any) => {
    if (app.automapper) {
        return app.automapper;
    }
    app.automapper = AutoMapperJs.AutoMapper.getInstance();
    return app.automapper;
})(this);