/// <reference path="arcady-automapper-interfaces.d.ts" />

// Type definitions for AutoMapper.js ${libraryVersion}
// Project: https://github.com/ArcadyIT/AutoMapper
// Definitions by: Bert Loedeman <https://github.com/loedeman>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

declare module AutoMapperJs__RemoveForDistribution__ {
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
        map(sourceKey: string): (destinationKey: string) => (sourceObject: any) => any;
        
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

    class TypeConverter implements ITypeConverter {
        convert(resolutionContext: IResolutionContext): any;
    }
    
    class PascalCaseNamingConvention implements INamingConvention {
        splittingExpression: RegExp;
        separatorCharacter: string;
        transformPropertyName(sourcePropertyNameParts: string[]): string;
    }
    
    class CamelCaseNamingConvention implements INamingConvention {
        splittingExpression: RegExp;
        separatorCharacter: string;
        transformPropertyName(sourcePropertyNameParts: string[]): string;
    }

// [bundle remove start]
}
// [bundle remove end]