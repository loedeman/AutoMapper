module AutoMapperJs {
    'use strict';

    /**
     * Interface for returning an object with available 'sub' functions to enable method chaining (e.g. automapper.createMap().forMember().forMember() ...)
     */
    export interface IAutoMapperCreateMapChainingFunctions {
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
    }
}