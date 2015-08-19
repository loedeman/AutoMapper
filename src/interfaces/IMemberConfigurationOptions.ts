module AutoMapperJs {
    /**
     * Configuration options for forMember mapping function.
     */
    export interface IMemberConfigurationOptions {
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
}