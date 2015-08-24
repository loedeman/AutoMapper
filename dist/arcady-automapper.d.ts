// Type definitions for AutoMapper.js 1.0.3
// Project: https://github.com/ArcadyIT/AutoMapper
// Definitions by: Bert Loedeman <https://github.com/loedeman>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

declare module AutoMapperJs {
    class AutoMapper {
        initialize(configFunction: (config: IConfiguration) => void): void;
        
        /**
         * Create a createMap curry function which expects only a destination key.
         * @param {string} sourceKey The map source key.
         * @returns {(destinationKey: string) => IAutoMapperCreateMapChainingFunctions}
         */
        createMap(sourceKey: string): (destinationKey: string) => IAutoMapperCreateMapChainingFunctions;

        /**
         * Create a mapping profile.
         * @param {string} sourceKey The map source key.
         * @param {string} destinationKey The map destination key.
         * @returns {Core.IAutoMapperCreateMapChainingFunctions}
         */
        createMap(sourceKey: string, destinationKey: string): IAutoMapperCreateMapChainingFunctions;

        /**
         * Create a map curry function which expects a destination key and a source object.
         * @param sourceKey Source key, for instance the source type name.
         * @returns {(destinationKey: string, sourceObject: any) => any}
         */
        map(sourceKey: string): (destinationKey: string, sourceObject: any) => any;
        
        /**
         * Create a map curry function which expects only a source object.
         * @param sourceKey Source key, for instance the source type name.
         * @param destinationKey Destination key, for instance the destination type name.
         * @returns {(sourceObject: any) => any}
         */
        map(sourceKey: string, destinationKey: string): (sourceObject: any) => any;

        /**
         * Execute a mapping from the source object to a new destination object with explicit mapping configuration and supplied mapping options (using createMap).
         * @param sourceKey Source key, for instance the source type name.
         * @param destinationKey Destination key, for instance the destination type name.
         * @param sourceObject The source object to map.
         * @returns {any} Destination object.
         */
        map(sourceKey: string, destinationKey: string, sourceObject: any): any;
    }

    interface IForMemberMapping {
        sourceProperty: string;
        destinationProperty: string;
        mappingValuesAndFunctions: Array<any>;
        ignore: boolean;
    }
    
    /**
     * Interface for returning an object with available 'sub' functions to enable method chaining (e.g. automapper.createMap().forMember().forMember() ...)
     */
    interface IAutoMapperCreateMapChainingFunctions {
        /**
         * Customize configuration for an individual destination member.
         * @param sourceProperty The destination member property name.
         * @param valueOrFunction The value or function to use for this individual member.
         * @returns {Core.IAutoMapperCreateMapChainingFunctions}
         */
        forMember: (sourceProperty: string, valueOrFunction: any) => IAutoMapperCreateMapChainingFunctions;
        /**
         * Customize configuration for an individual source member.
         * @param sourceProperty The source member property name.
         * @param sourceMemberConfigurationFunction The function to use for this individual member.
         * @returns {Core.IAutoMapperCreateMapChainingFunctions}
         */
        forSourceMember: (sourceProperty: string, sourceMemberConfigurationFunction: (opts: ISourceMemberConfigurationOptions) => void) => IAutoMapperCreateMapChainingFunctions;
        /**
         * Customize configuration for all destination members.
         * @param func The function to use for this individual member.
         * @returns {Core.IAutoMapperCreateMapChainingFunctions}
         */
        forAllMembers: (func: (destinationObject: any, destinationPropertyName: string, value: any) => void) => IAutoMapperCreateMapChainingFunctions;

        /**
         * Skip normal member mapping and convert using a custom type converter (instantiated during mapping).
         * @param typeConverterClassOrFunction The converter class or function to use when converting.
         */
        convertUsing: (typeConverterClassOrFunction: any) => void;

        /**
         * Specify to which class type AutoMapper should convert. When specified, AutoMapper will create an instance of the given type, instead of returning a new object literal.
         * @param typeClass The destination type class.
         * @returns {Core.IAutoMapperCreateMapChainingFunctions}
         */
        convertToType: (typeClass: new () => any) => IAutoMapperCreateMapChainingFunctions;
        
        withProfile: (profileName: string) => IAutoMapperCreateMapChainingFunctions;
    }

    /**
     * The mapping configuration for the current mapping keys/types.
     */
    interface IMapping {
        /**
         * The mapping key
         */
        key: string;
        /**
         * The mappings for forAllMembers functions.
         */
        forAllMemberMappings: Array<(destinationObject: any, destinationPropertyName: string, value: any) => void>;
        /**
         * The mappings for forMember functions.
         */
        forMemberMappings: { [key: string]: IForMemberMapping; };

        /**
         * Skip normal member mapping and convert using a type converter.
         * @param resolutionContext Context information regarding resolution of a destination value
         * @returns {any} Destination object.
         */
        typeConverterFunction: (resolutionContext: IResolutionContext) => any;

        /**
         * The destination type class to convert to.
         */
        destinationTypeClass: any;
        
        profile?: IProfile;
    }
    
    /**
     * Context information regarding resolution of a destination value
     */
    export interface IResolutionContext {
        /**
         * Source value
         */
        sourceValue: any;

        /**
         * Destination value
         */
        destinationValue: any;

        /**
         * Source property name
         */
        sourcePropertyName?: string;

        /**
         * Destination property name
         */
        destinationPropertyName?: string;

        /**
         * Index of current collection mapping
         */
        arrayIndex?: number;
    }
    
    /**
     * Configuration options for forMember mapping function.
     */
    interface IMemberConfigurationOptions {
        /**
         * Map from a custom source property name.
         * @param sourcePropertyName The source property to map.
         */
        mapFrom: (sourcePropertyName: string) => void;

        /**
         * When this configuration function is used, the (destination) property is ignored when mapping.
         */
        ignore: () => void;

        /**
         * The source object to map.
         */
        sourceObject: any;

        /**
         * The source property to map.
         */
        sourcePropertyName: string;

        /**
         * The destination property value, used for stacking multiple for(Source)Member calls while elaborating the intermediate result.
         */
        destinationPropertyValue: any;
    }

    /**
     * Configuration options for forSourceMember mapping function.
     */
    interface ISourceMemberConfigurationOptions {
        /**
         * When this configuration function is used, the source property is ignored when mapping.
         */
        ignore: () => void;
    }

    export interface ITypeConverter {
        convert: (resolutionContext: IResolutionContext) => any;
    }
    
    export interface INamingConvention{
        splittingExpression: RegExp;
        separatorCharacter: string;
        
        transformPropertyName: (sourcePropertyNameParts: string[]) => string;
    }
    
    export interface IConfiguration {
        addProfile(profile: IProfile): void;
    }

    export interface IProfile {
        profileName: string;
        sourceMemberNamingConvention: INamingConvention;
        destinationMemberNamingConvention: INamingConvention;
        
        configure?: () => void;
    }
}

declare var automapper: AutoMapperJs.AutoMapper;