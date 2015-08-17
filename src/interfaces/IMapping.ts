module AutoMapperJs {
    'use strict';

    /**
     * The mapping configuration for the current mapping keys/types.
     */
    export interface IMapping {
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
    }
}