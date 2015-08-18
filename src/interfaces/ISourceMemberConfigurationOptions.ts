module AutoMapperJs {
    'use strict'; 
    /**
     * Configuration options for forSourceMember mapping function.
     */
    export interface ISourceMemberConfigurationOptions {
        /**
         * When this configuration function is used, the source property is ignored when mapping.
         */
        ignore: () => void;
    }
}