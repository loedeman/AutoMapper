module AutoMapperJs {
    'use strict';

    export interface IForMemberMapping {
        sourceProperty: string;
        destinationProperty: string;
        mappingValuesAndFunctions: Array<any>;
        ignore: boolean;
    }
}