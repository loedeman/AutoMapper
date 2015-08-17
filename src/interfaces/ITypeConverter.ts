module AutoMapperJs {
    'use strict';

    export interface ITypeConverter {
        convert: (resolutionContext: IResolutionContext) => any;
    }
}