/// <reference path="../../dist/automapper-interfaces.d.ts" />
/// <reference path="AutoMapperBase.ts" />
/// <reference path="AsyncAutoMapper.ts" />
/// <reference path="TypeConverter.ts" />
/// <reference path="AutoMapperHelper.ts" />
/// <reference path="AutoMapperValidator.ts" />

module AutoMapperJs {
    'use strict';

    type IFluentFunc = ICreateMapFluentFunctions;
    type IDMCO = IMemberConfigurationOptions;
    type ISMCO = ISourceMemberConfigurationOptions;
    type IMC = IMemberCallback;
    type IRC = IResolutionContext;
    type TC = TypeConverter;

    export class AutoMapper extends AutoMapperBase {
        private static _instance = new AutoMapper();

        private _profiles: { [name: string]: IProfile };
        private _mappings: { [key: string]: IMapping };

        private _asyncMapper: AsyncAutoMapper;

        /**
         * This class is intended to be a Singleton. Preferrably use getInstance() 
         * function instead of using the constructor directly from code.
         */
        constructor() {
            super();

            if (AutoMapper._instance) {
                return AutoMapper._instance;
            } else {
                AutoMapper._instance = this;

                this._profiles = {};
                this._mappings = {};

                this._asyncMapper = new AsyncAutoMapper();
            }
        }

        public static getInstance(): AutoMapper {
            return AutoMapper._instance;
        }

        /**
         * Initializes the mapper with the supplied configuration.
         * @param {(config: IConfiguration) => void} configFunction Configuration function to call.
         */
        public initialize(configFunction: (config: IConfiguration) => void): void {
            var that = this;

            var configuration: IConfiguration = <any>{
                addProfile: (profile: IProfile) : void => {
                    profile.configure();
                    that._profiles[profile.profileName] = profile;
                },
                createMap: function (sourceKey: string, destinationKey: string): IFluentFunc {
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
         * @returns {Core.ICreateMapFluentFunctions}
         */
        public createMap(sourceKeyOrType: string | (new() => any), destinationKeyOrType: string | (new() => any)): IFluentFunc {
            // provide currying support.
            if (arguments.length < 2) {
                return AutoMapperHelper.handleCurrying(this.createMap, arguments, this);
            }

            var mapping = this.createMappingObjectForGivenKeys(sourceKeyOrType, destinationKeyOrType);

            return this.createMapGetFluentApiFunctions(mapping);
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
                return this.mapInternal(super.getMapping(this._mappings, sourceKeyOrType, destinationKeyOrType), sourceObject);
            }

            // provide performance optimized (preloading) currying support.
            if (arguments.length === 2) {
                return (srcObj: any) => this.mapInternal(super.getMapping(this._mappings, sourceKeyOrType, destinationKeyOrType), srcObj);
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
            return this._asyncMapper.map(sourceKeyOrType, destinationKeyOrType, this._mappings, sourceObject, callback);
        }

        /**
         * Validates mapping configuration by dry-running. Since JS does not fully support typing, it only checks if properties match on both
         * sides. The function needs IMapping.sourceTypeClass and IMapping.destinationTypeClass to function.
         * @param {boolean} strictMode Whether or not to fail when properties sourceTypeClass or destinationTypeClass are unavailable. 
         */
        public assertConfigurationIsValid(strictMode: boolean = true): void {
            AutoMapperValidator.assertConfigurationIsValid(this._mappings, strictMode);
        }

        private createMappingObjectForGivenKeys(srcKeyOrType: string | (new() => any), dstKeyOrType: string | (new() => any)): IMapping {
            var mapping: IMapping = {
                sourceKey: super.getKey(srcKeyOrType),
                destinationKey: super.getKey(dstKeyOrType),
                forAllMemberMappings: new Array<(destinationObject: any, destinationPropertyName: string, value: any) => void>(),
                forMemberMappings: {},
                properties: [],
                typeConverterFunction: undefined,
                mapItemFunction: (m: IMapping, srcObj: any, dstObj: any): any => this.mapItem(m, srcObj, dstObj),
                sourceTypeClass: (typeof srcKeyOrType === 'string' ? undefined : srcKeyOrType),
                destinationTypeClass: (typeof dstKeyOrType === 'string' ? undefined : dstKeyOrType),
                profile: undefined,
                async: false
            };
            this._mappings[mapping.sourceKey + mapping.destinationKey] = mapping;
            return mapping;
        }

        private createMapGetFluentApiFunctions(mapping: IMapping): IFluentFunc {
            // create a fluent interface / method chaining (e.g. automapper.createMap().forMember().forMember() ...)
            var fluentFunc: IFluentFunc = {
                forMember: (prop: string, valFunc: any | ((opts: IDMCO) => any) | ((opts: IDMCO, cb: IMC) => void)) : IFluentFunc =>
                    this.createMapForMember(mapping, fluentFunc, prop, valFunc, false),
                forSourceMember: (prop: string, cfgFunc: ((opts: ISMCO) => any) | ((opts: ISMCO, cb: IMC) => void)) : IFluentFunc =>
                    this.createMapForSourceMember(mapping, fluentFunc, prop, cfgFunc),
                forAllMembers: (func: (dstObj: any, dstProp: string, value: any) => void) : IFluentFunc =>
                    this.createMapForAllMembers(mapping, fluentFunc, func),
                ignoreAllNonExisting: () : IFluentFunc => this.createMapIgnoreAllNonExisting(mapping, fluentFunc),
                convertToType: (type: new () => any) : IFluentFunc => this.createMapConvertToType(mapping, fluentFunc, type),
                convertUsing: (tcClassOrFunc: ((ctx: IRC) => any) | ((ctx: IRC, callback: IMapCallback) => void) | TC | (new() => TC)) : void =>
                    this.createMapConvertUsing(mapping, tcClassOrFunc),
                withProfile: (profile: string) : void => this.createMapWithProfile(mapping, profile)
            };

            return fluentFunc;
        }

        private createMapForMember(mapping: IMapping, fluentFunc: IFluentFunc, destinationProperty: string, valueOrFunction: any, sourceMapping: boolean): IFluentFunc {
            var metadata = AutoMapperHelper.getMappingMetadataFromConfigFunction(destinationProperty, valueOrFunction, sourceMapping);
            var property: IProperty;
            if (!sourceMapping) {
                property = this.getPropertyByDestinationProperty(mapping.properties, destinationProperty);
                if (!property) {
                    property = this.getOrCreateProperty(metadata.source.split('.'), mapping.properties, null, destinationProperty, sourceMapping);
                }
            } else {
                property = this.getOrCreateProperty(metadata.source.split('.'), mapping.properties, null, destinationProperty, sourceMapping);
            }

            if (metadata.async) {
                this.createMapForMemberAsync(mapping, property, valueOrFunction, metadata);
            } else {
                this.createMapForMemberSync(mapping, property, valueOrFunction, metadata);
            }

            return fluentFunc;
        }

        private createMapForMemberAsync(mapping: IMapping, property: IProperty, valueOrFunction: any, metadata: IMemberMappingMetaData): void {
            if (this.createMapForMemberHandleIgnore(property, metadata)) {
                return;
            }

            this._asyncMapper.createMapForMember(mapping, property, <(opts: IDMCO, cb: IMemberCallback) => void>valueOrFunction, metadata);
        }

        private createMapForMemberSync(mapping: IMapping, property: IProperty, valueOrFunction: any, metadata: IMemberMappingMetaData): void {
            if (this.createMapForMemberHandleIgnore(property, metadata)) {
                return;
            }

            this.createMapForMemberHandleMapFrom(mapping, property, metadata);
            property.conditionFunction = metadata.condition;
            property.conversionValuesAndFunctions.push(valueOrFunction);
        }

        private createMapForMemberHandleMapFrom(mapping: IMapping, property: IProperty, metadata: IMemberMappingMetaData): void {
            if (metadata.source !== metadata.destination) {
                var sourceNameParts = metadata.source.split('.');
                if (sourceNameParts.length === property.level) {
                    this.updatePropertyName(sourceNameParts, property);
                } else {
                    // check if only one destination on property root. in that case, rebase property and overwrite root.
                    if (property.metadata.root.metadata.destinationCount === 1) {
                        var propertyRootIndex = mapping.properties.indexOf(property.metadata.root);
                        mapping.properties[propertyRootIndex] = undefined;
                        var propArray: IProperty[] = [];
                        var newProperty = this.getOrCreateProperty(metadata.source.split('.'), propArray, null, metadata.destination, metadata.sourceMapping);
                        newProperty.conditionFunction = property.conditionFunction;
                        newProperty.conversionValuesAndFunctions = property.conversionValuesAndFunctions;
                        mapping.properties[propertyRootIndex] = propArray[0];
                    } else {
                        throw new Error('Rebasing properties is not yet implemented. For now, use mapFrom() before other methods on the same destination.');
                        // if (!property.children && property.destinations.length === 1) {
                        //     var propertyRootIndex = mapping.properties.indexOf(property.metadata.root);
                        //     mapping.properties[propertyRootIndex] = property.metadata.root;
                        // }
                        // TODO Check if this is the only destination
                        //       yes? replace parent and update mapping root property
                        //       no? replace parent and add new mapping property.
                        //var propertyRootIndex = mapping.properties.indexOf(property.metadata.root);
                    }
                }
            }
        }

        private updatePropertyName(sourceNameParts: string[], property: IProperty): void {
            property.name = sourceNameParts[sourceNameParts.length - 1];
            if (sourceNameParts.length === 1) {
                return;
            }

            this.updatePropertyName(sourceNameParts.splice(0, 1), property.metadata.parent);
        }

        private createMapForMemberHandleIgnore(property: IProperty, metadata: IMemberMappingMetaData): boolean {
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
        }

        private getPropertyByDestinationProperty(properties: IProperty[], destinationPropertyName: string): IProperty {
            if (properties === null || properties === undefined) {
                return null;
            }

            for (let srcProp of properties) {
                if (srcProp.metadata.destinations !== null && srcProp.metadata.destinations !== undefined) {
                    for (let destination in srcProp.metadata.destinations) {
                        if (destination === destinationPropertyName) {
                            return srcProp.metadata.destinations[destination].source;
                        }
                    }
                }

                let childProp = this.getPropertyByDestinationProperty(srcProp.children, destinationPropertyName);
                if (childProp != null) {
                    return childProp;
                }
            }

            return null;
        }

        private getOrCreateProperty(propertyNameParts: string[], children: IProperty[], parent: IProperty, destination: string, sourceMapping: boolean): IProperty {
            var name = propertyNameParts[0];

            var property: IProperty;
            if (children) {
                for (var child of children) {
                    if (child.name === name) {
                        property = child;
                        break;
                    }
                }
            }

            if (property === undefined || property === null) {
                property = this.createProperty(name, parent, children, sourceMapping);
            }

            if (propertyNameParts.length === 1) {
                if (destination) {
                    let destinationTargetArray: IProperty[] = property.destinations ? property.destinations : [];
                    var dstProp = this.getOrCreateProperty(destination.split('.'), destinationTargetArray, null, null, sourceMapping);
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

            return this.getOrCreateProperty(propertyNameParts.slice(1), property.children, property, destination, sourceMapping);
        }

        private createProperty(name: string, parent: IProperty, propertyArray: IProperty[], sourceMapping: boolean): IProperty {
            var property: IProperty = {
                name: name,
                metadata: {
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

            propertyArray.push(property);

            return property;
        }

        private findExistingMemberMapping(mapping: IMapping, property: string, sourceMapping: boolean): IForMemberMapping {
            return sourceMapping
                    ? mapping.forMemberMappings[property]
                    : this.findMemberForDestinationProperty(mapping, property);
        }

        private createDefaultMemberMapping(property: string, sourceMapping: boolean): IForMemberMapping {
            return {
                sourceProperty: property,
                destinationProperty: property,
                sourceMapping: sourceMapping,
                mappingValuesAndFunctions: new Array<any>(),
                ignore: false,
                async: false,
                conditionFunction: undefined
            };
        }

        private findMemberForDestinationProperty(mapping: IMapping, destinationPropertyName: string): IForMemberMapping {
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

        private createMapForSourceMember(mapping: IMapping, fluentFunc: IFluentFunc, srcProp: string, cnf: ((opts: ISMCO) => any) | ((opts: ISMCO, cb: IMC) => void)): IFluentFunc {
            if (typeof cnf !== 'function') {
                throw new Error('Configuration of forSourceMember has to be a function with one (sync) or two (async) options parameters.');
            }

            return this.createMapForMember(mapping, fluentFunc, srcProp, cnf, true);
        }

        private createMapForSourceMemberHandleSyncMappingFunction(memberMapping: IForMemberMapping, memberConfigFunc: (opts: ISourceMemberConfigurationOptions) => any): void {
            var configFuncOptions = {
                ignore: (): void => {
                    memberMapping.ignore = true;
                    memberMapping.async = false;
                    memberMapping.mappingValuesAndFunctions = new Array<any>();
                    memberMapping.destinationProperty = undefined;
                }
            };

            memberConfigFunc(configFuncOptions);

            if (!memberMapping.ignore) {
                memberMapping.mappingValuesAndFunctions.push(memberConfigFunc);
            }
        }

        private createMapForAllMembers(mapping: IMapping, fluentFunc: IFluentFunc, func: (dstObj: any, dstProp: string, val: any) => void): IFluentFunc {
            mapping.forAllMemberMappings.push(func);
            return fluentFunc;
        }

        private createMapIgnoreAllNonExisting(mapping: IMapping, fluentFunc: IFluentFunc): IFluentFunc {
            mapping.ignoreAllNonExisting = true;
            return fluentFunc;
        }

        private createMapConvertToType(mapping: IMapping, fluentFunc: IFluentFunc, typeClass: new () => any): IFluentFunc {
            if (mapping.destinationTypeClass) {
                if (mapping.destinationTypeClass === typeClass) {
                    return fluentFunc;
                }

                throw new Error('Destination type class can only be set once.');
            }

            mapping.destinationTypeClass = typeClass;
            return fluentFunc;
        }

        private createMapConvertUsing(mapping: IMapping, tcClassOrFunc: ((ctx: IRC) => any) | ((ctx: IRC, cb: IMapCallback) => void) | TC | (new() => TC)): void {
            try {
                // check if sync: TypeConverter instance
                if (tcClassOrFunc instanceof TypeConverter) {
                    this.configureSynchronousConverterFunction(mapping, tcClassOrFunc.convert);
                    return;
                }

                // check if sync: TypeConverter class definition
                var typeConverter: TypeConverter;
                try {
                    typeConverter = (<TypeConverter>new (<new() => TypeConverter>tcClassOrFunc)());
                } catch (e) {
                    // Obviously, typeConverterClassOrFunction is not a TypeConverter class definition
                }
                if (typeConverter instanceof TypeConverter) {
                    this.configureSynchronousConverterFunction(mapping, typeConverter.convert);
                    return;
                }

                var functionParameters = AutoMapperHelper.getFunctionParameters(<any>tcClassOrFunc);

                // check if sync: function with resolutionContext parameter
                if (functionParameters.length === 1) {
                    this.configureSynchronousConverterFunction(mapping, <(resolutionContext: IResolutionContext) => any>tcClassOrFunc);
                    return;
                }

                // check if async: function with resolutionContext and callback parameters
                if (functionParameters.length === 2) {
                    this._asyncMapper.createMapConvertUsing(mapping, <(ctx: IResolutionContext, cb: IMapCallback) => void>tcClassOrFunc);
                    return;
                }

                // okay, just try feeding the function to the configure function anyway...
                this.configureSynchronousConverterFunction(mapping, <any>tcClassOrFunc);
            } catch (e) {
                throw new Error(`The value provided for typeConverterClassOrFunction is invalid. ${e}`);
            }

            throw new Error(`The value provided for typeConverterClassOrFunction is invalid.`);
        }

        private configureSynchronousConverterFunction(mapping: IMapping, converterFunc: Function): void {
            if (!converterFunc || AutoMapperHelper.getFunctionParameters(converterFunc).length !== 1) {
                throw new Error('The function provided does not provide exactly one (resolutionContext) parameter.');
            }

            mapping.typeConverterFunction = <(resolutionContext: IResolutionContext) => any>converterFunc;
            mapping.mapItemFunction = (m: IMapping, srcObj: any, dstObj: any): any => this.mapItemUsingTypeConverter(m, srcObj, dstObj);
        }


        private createMapWithProfile(mapping: IMapping, profileName: string): void {
            // check if given profile exists
            var profile = this._profiles[profileName];
            if (typeof profile === 'undefined' || profile.profileName !== profileName) {
                throw new Error(`Could not find profile with profile name '${profileName}'.`);
            }

            mapping.profile = profile;
            // merge mappings
            this.createMapWithProfileMergeMappings(mapping, profileName);
        }

        private createMapWithProfileMergeMappings(mapping: IMapping, profileName: string): void {
            var profileMappingKey = `${profileName}=>${mapping.sourceKey}${profileName}=>${mapping.destinationKey}`;
            var profileMapping: IMapping = this._mappings[profileMappingKey];
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
            for (let property of profileMapping.properties) {
                this.mergeProperty(mapping, mapping.properties, property);
            }
        }

        private mergeProperty(mapping: IMapping, properties: IProperty[], property: IProperty): void {
            for (let index = 0; index < mapping.properties.length; index++) {
                let existing = mapping.properties[index];

                if (existing.name === property.name) {
                    // in which case, we overwrite that one with the profile's property mapping.
                    // okay, maybe a bit rude, but real merging is pretty complex and you should
                    // probably not want to combine normal and profile createMap.forMember calls.
                    mapping.properties[index] = property;
                }
            }
        }

        private mapInternal(mapping: IMapping, sourceObject: any): any {
            if (mapping.async) {
                throw new Error('Impossible to use asynchronous mapping using automapper.map(); use automapper.mapAsync() instead.');
            }

            if (super.isArray(sourceObject)) {
                return this.mapArray(mapping, sourceObject);
            }

            return (<IMapItemFunction>mapping.mapItemFunction)(mapping, sourceObject, super.createDestinationObject(mapping.destinationTypeClass));
        }

        private mapArray(mapping: IMapping, sourceArray: Array<any>): Array<any> {
            var destinationArray = super.handleArray(mapping, sourceArray, (sourceObject: any, destinationObject: any) => {
                (<IMapItemFunction>mapping.mapItemFunction)(mapping, sourceObject, destinationObject);
            });
            return destinationArray;
        }

        private mapItem(mapping: IMapping, sourceObject: any, destinationObject: any): void {
            super.handleItem(mapping, sourceObject, destinationObject, (propertyName: string) => {
                this.mapProperty(mapping, sourceObject, destinationObject, propertyName);
            });
            return destinationObject;
        }

        private mapItemUsingTypeConverter(mapping: IMapping, sourceObject: any, destinationObject: any, arrayIndex?: number): void {
            var resolutionContext: IResolutionContext = {
                sourceValue: sourceObject,
                destinationValue: destinationObject
            };
            return (<(ctx: IResolutionContext) => any>mapping.typeConverterFunction)(resolutionContext);
        }

        private mapProperty(mapping: IMapping, sourceObject: any, destinationObject: any, sourceProperty: string): void {
            super.handleProperty(mapping, sourceObject, sourceProperty, destinationObject,
                (destinations: IProperty[], valuesAndFunctions: Array<any>, opts: IDMCO) => {
                    var destinationPropertyValue = this.handlePropertyMappings(valuesAndFunctions, opts);
                    for (let destination of destinations) {
                        super.setPropertyValue(mapping, destinationObject, destination, destinationPropertyValue);
                    }
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