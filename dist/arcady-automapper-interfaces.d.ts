// [bundle remove start]
// Type definitions for AutoMapper.js 1.1.7
// Project: https://github.com/ArcadyIT/AutoMapper
// Definitions by: Bert Loedeman <https://github.com/loedeman>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

declare module AutoMapperJs {
// [bundle remove end]

    /**
     * Member mapping properties.
     */
    interface IForMemberMapping {
        /** The source member property name. */
        sourceProperty: string;
        /** The destination member property name. */
        destinationProperty: string;
        /** All mapping values and/or functions resulting from stacked for(Source)Member calls. */
        mappingValuesAndFunctions: Array<any>;
        /** Whether or not this destination property must be ignored. */
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
         * @returns {IAutoMapperCreateMapChainingFunctions}
         */
        forMember: (sourceProperty: string, valueOrFunction: any|((opts: IMemberConfigurationOptions) => any)) => IAutoMapperCreateMapChainingFunctions;

        /**
         * Customize configuration for an individual source member.
         * @param sourceProperty The source member property name.
         * @param sourceMemberConfigurationFunction The function to use for this individual member.
         * @returns {IAutoMapperCreateMapChainingFunctions}
         */
        forSourceMember: (sourceProperty: string, sourceMemberConfigurationFunction: (opts: ISourceMemberConfigurationOptions) => void) => IAutoMapperCreateMapChainingFunctions;
        /**
         * Customize configuration for all destination members.
         * @param func The function to use for this individual member.
         * @returns {IAutoMapperCreateMapChainingFunctions}
         */
        forAllMembers: (func: (destinationObject: any, destinationPropertyName: string, value: any) => void) => IAutoMapperCreateMapChainingFunctions;

        /**
         * Skip normal member mapping and convert using a custom type converter (instantiated during mapping).
         * @param typeConverterClassOrFunction The converter class or function to use when converting.
         */
        convertUsing: (typeConverterClassOrFunction: ((resolutionContext: IResolutionContext) => any)|TypeConverter|(new() => TypeConverter)) => void;

        /**
         * Specify to which class type AutoMapper should convert. When specified, AutoMapper will create an instance of the given type, instead of returning a new object literal.
         * @param typeClass The destination type class.
         * @returns {IAutoMapperCreateMapChainingFunctions}
         */
        convertToType: (typeClass: new () => any) => IAutoMapperCreateMapChainingFunctions;
        
        /**
         * Specify which profile should be used when mapping.
         * @param {string} profileName The profile name.
         * @returns {IAutoMapperCreateMapChainingFunctions}
         */
        withProfile: (profileName: string) => IAutoMapperCreateMapChainingFunctions;
    }

    /**
     * The mapping configuration for the current mapping keys/types.
     */
    interface IMapping {
        /** The mapping key. */
        key: string;

        /** The mappings for forAllMembers functions. */
        forAllMemberMappings: Array<(destinationObject: any, destinationPropertyName: string, value: any) => void>;

        /** The mappings for forMember functions. */
        forMemberMappings: { [key: string]: IForMemberMapping; };

        /**
         * Skip normal member mapping and convert using a type converter.
         * @param resolutionContext Context information regarding resolution of a destination value
         * @returns {any} Destination object.
         */
        typeConverterFunction: (resolutionContext: IResolutionContext) => any;

        /** The destination type class to convert to. */
        destinationTypeClass: any;
        
        /** The profile used when mapping. */
        profile?: IProfile;
    }
    
    /**
     * Context information regarding resolution of a destination value
     */
    export interface IResolutionContext {
        /** Source value */
        sourceValue: any;

        /** Destination value */
        destinationValue: any;

        /** Source property name */
        sourcePropertyName?: string;

        /** Destination property name */
        destinationPropertyName?: string;

        /** Index of current collection mapping */
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
         * When this configuration function is used, the (destination) property is ignored
         * when mapping. 
         */
        ignore: () => void;

        /** The source object to map. */
        sourceObject: any;

        /** The source property to map. */
        sourcePropertyName: string;

        /**
         * The destination property value, used for stacking multiple for(Source)Member calls 
         * while elaborating the intermediate result.
         */
        destinationPropertyValue: any;
    }

    /**
     * Configuration options for forSourceMember mapping function.
     */
    interface ISourceMemberConfigurationOptions {
        /**
         * When this configuration function is used, the source property is ignored
         * when mapping.
         */
        ignore: () => void;
    }

    /**
     * Converts source type to destination type instead of normal member mapping
     */
    export interface ITypeConverter {
        /**
         * Performs conversion from source to destination type.
         * @param {IResolutionContext} resolutionContext Resolution context.
         * @returns {any} Destination object.
         */
        convert: (resolutionContext: IResolutionContext) => any;
    }
    
    /**
     * Defines a naming convention strategy.
     */
    export interface INamingConvention {
        /** Regular expression on how to tokenize a member. */
        splittingExpression: RegExp;
        
        /** Character to separate on. */
        separatorCharacter: string;
        
        /**
         * Transformation function called when this convention is the destination naming convention.
         * @param {string[]} sourcePropertyNameParts Array containing tokenized source property name parts.
         * @returns {string} Destination property name
         */
        transformPropertyName: (sourcePropertyNameParts: string[]) => string;
    }
    
    /**
     * Configuration for profile-specific maps.
     */
    export interface IConfiguration {
        /**
         * Add an existing profile
         * @param profile {IProfile} Profile to add.
         */
        addProfile(profile: IProfile): void;

        /**
         * Create a createMap curry function which expects only a destination key.
         * @param {string} sourceKey The map source key.
         * @returns {(destinationKey: string) => IAutoMapperCreateMapChainingFunctions}
         */
        createMap?(sourceKey: string): (destinationKey: string) => IAutoMapperCreateMapChainingFunctions;

        /**
         * Create a mapping profile.
         * @param {string} sourceKey The map source key.
         * @param {string} destinationKey The map destination key.
         * @returns {Core.IAutoMapperCreateMapChainingFunctions}
         */
        createMap?(sourceKey: string, destinationKey: string): IAutoMapperCreateMapChainingFunctions;
    }

    /**
     * Provides a named configuration for maps. Naming conventions become scoped per profile.
     */
    export interface IProfile {
        /** Profile name */
        profileName: string;
        
        /** Naming convention for source members */
        sourceMemberNamingConvention: INamingConvention;
        
        /** Naming convention for destination members */
        destinationMemberNamingConvention: INamingConvention;
    }
}