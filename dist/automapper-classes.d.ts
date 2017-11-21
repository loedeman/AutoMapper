// [bundle remove start]
/// <reference path="automapper-interfaces.d.ts" />
// [bundle remove end]
// Type definitions for AutoMapper.js 1.9.0
// Project: https://github.com/loedeman/AutoMapper
// Definitions by: Bert Loedeman <https://github.com/loedeman>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

declare module AutoMapperJs {
    /**
     * AutoMapper implementation, for both creating maps and performing maps. Comparable usage and functionality to the original
     * .NET AutoMapper library is the pursuit of this implementation.
     */
    class AutoMapper {
        /**
         * Initializes the mapper with the supplied configuration.
         * @param {(config: IConfiguration) => void} Configuration function to call.
         */
        initialize(configFunction: (config: IConfiguration) => void): void;

        /**
         * Create a createMap curry function which expects only a destination key.
         * @param {string} sourceKey The map source key.
         * @returns {(destinationKey: string) => ICreateMapFluentFunctions}
         */
        createMap(sourceKey: string | (new() => any)): (destinationKey: string | (new() => any)) => ICreateMapFluentFunctions;

        /**
         * Create a mapping profile.
         * @param {string} sourceKey The map source key.
         * @param {string} destinationKey The map destination key.
         * @returns {Core.ICreateMapFluentFunctions}
         */
        createMap(sourceKey: string | (new() => any), destinationKey: string | (new() => any)): ICreateMapFluentFunctions;

        /**
         * Create a map curry function which expects a destination key and a source object.
         * @param sourceKey Source key, for instance the source type name.
         * @returns {(destinationKey: string, sourceObject: any) => any}
         */
        map(sourceKey: string | (new() => any)): (destinationKey: string | (new() => any), sourceObject: any) => any;

        /**
         * Create a map curry function which expects only a source object.
         * @param sourceKey Source key, for instance the source type name.
         * @param destinationKey Destination key, for instance the destination type name.
         * @returns {(sourceObject: any) => any}
         */
        map(sourceKey: string | (new() => any), destinationKey: string | (new() => any)): (sourceObject: any) => any;

        /**
         * Execute a mapping from the source object to a new destination object with explicit mapping configuration and supplied mapping options (using createMap).
         * @param sourceKey Source key, for instance the source type name.
         * @param destinationKey Destination key, for instance the destination type name.
         * @param sourceObject The source object to map.
         * @returns {any} Destination object.
         */
        map(sourceKey: string | (new() => any), destinationKey: string | (new() => any), sourceObject: any): any;

        /**
         * Create a mapAsync curry function which expects a destination key, a source object and a callback function.
         * @param sourceKey Source key, for instance the source type name.
         * @returns {(destinationKey: string, sourceObject: any, callback: IMapCallback) => void}
         */
        mapAsync(sourceKey: string | (new() => any)): (destinationKey: string | (new() => any), sourceObject: any, callback: IMapCallback) => void;

        /**
         * Create a map curry function which expects only a source object and a callback function.
         * @param sourceKey Source key, for instance the source type name.
         * @param destinationKey Destination key, for instance the destination type name.
         * @param sourceObject The source object to map.
         * @returns {(callback: IMapCallback) => void}
         */
        mapAsync(sourceKey: string | (new() => any), destinationKey: string | (new() => any), sourceObject: any): (callback: IMapCallback) => void;

        /**
         * Create a map curry function which expects only a source object and a callback function.
         * @param sourceKey Source key, for instance the source type name.
         * @param destinationKey Destination key, for instance the destination type name.
         * @returns {(sourceObject: any, callback: IMapCallback) => void}
         */
        mapAsync(sourceKey: string | (new() => any), destinationKey: string | (new() => any)): (sourceObject: any, callback: IMapCallback) => void;

        /**
         * Execute an asynchronous mapping from the source object to a new destination object with explicit mapping configuration and supplied mapping options (using createMap).
         * @param sourceKey Source key, for instance the source type name.
         * @param destinationKey Destination key, for instance the destination type name.
         * @param sourceObject The source object to map.
         * @param {IMapCallback} callback The callback to call when asynchronous mapping is complete.
         */
        mapAsync(sourceKey: string | (new() => any), destinationKey: string | (new() => any), sourceObject: any, callback: IMapCallback): void;

        /**
         * Validates mapping configuration by dry-running. Since JS does not
         * fully support typing, it only checks if properties match on both
         * sides. The function needs IMapping.sourceTypeClass and 
         * IMapping.destinationTypeClass to function.
         * @param {boolean} strictMode Whether or not to fail when properties
         *                             sourceTypeClass or destinationTypeClass
         *                             are unavailable. 
         */
        assertConfigurationIsValid(strictMode?: boolean): void;
    }

    class AsyncAutoMapper {
        /* For Test Purposes Only */
    }

    /**
     * Converts source type to destination type instead of normal member mapping
     */
    class TypeConverter implements ITypeConverter {
        /**
         * Performs conversion from source to destination type.
         * @param {IResolutionContext} resolutionContext Resolution context.
         * @returns {any} Destination object.
         */
        convert(resolutionContext: IResolutionContext): any;
    }

    export class Profile implements IProfile {
        /** Profile name */
        public profileName: string;
        
        /** Naming convention for source members */
        public sourceMemberNamingConvention: INamingConvention;
        
        /** Naming convention for destination members */
        public destinationMemberNamingConvention: INamingConvention;
        
        /**
         * Create a createMap curry function which expects only a destination key.
         * @param {string} sourceKey The map source key.
         * @returns {(destinationKey: string) => ICreateMapFluentFunctions}
         */
        protected createMap(sourceKey: string): (destinationKey: string) => ICreateMapFluentFunctions;

        /**
         * Create a mapping profile.
         * @param {string} sourceKey The map source key.
         * @param {string} destinationKey The map destination key.
         * @returns {Core.ICreateMapFluentFunctions}
         */
        protected createMap(sourceKey: string, destinationKey: string): ICreateMapFluentFunctions;
        
        /**
         * Implement this method in a derived class and call the CreateMap method to associate that map with this profile.
         * Avoid calling the AutoMapper class / automapper instance from this method. 
         */
        public configure(): void;
    }
    
    /**
     * Defines the PascalCase naming convention strategy.
     */
    class PascalCaseNamingConvention implements INamingConvention {
        /** Regular expression on how to tokenize a member. */
        splittingExpression: RegExp;

        /** Character to separate on. */
        separatorCharacter: string;

        /**
         * Transformation function called when this convention is the destination naming convention.
         * @param {string[]} sourcePropertyNameParts Array containing tokenized source property name parts.
         * @returns {string} Destination property name
         */
        transformPropertyName(sourcePropertyNameParts: string[]): string;
    }
    
    /**
     * Defines the camelCase naming convention strategy.
     */
    class CamelCaseNamingConvention implements INamingConvention {
        /** Regular expression on how to tokenize a member. */
        splittingExpression: RegExp;

        /** Character to separate on. */
        separatorCharacter: string;

        /**
         * Transformation function called when this convention is the destination naming convention.
         * @param {string[]} sourcePropertyNameParts Array containing tokenized source property name parts.
         * @returns {string} Destination property name
         */
        transformPropertyName(sourcePropertyNameParts: string[]): string;
    }

// [bundle remove start]
}
// [bundle remove end]