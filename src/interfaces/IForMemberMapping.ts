module AutoMapperJs {
    'use strict';

    export interface IForMemberMapping {
        sourceProperty: string;
        destinationProperty: string;
        mappingValueOrFunction: any;
        destinationMapping: boolean;
        ignore: boolean;
    }
}