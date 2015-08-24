/// <reference path="../../dist/arcady-automapper-interfaces.d.ts" />

module AutoMapperJs {
    'use strict';

    export class TypeConverter implements ITypeConverter {
        public convert(resolutionContext: IResolutionContext): any {
            // NOTE BL Unfortunately, TypeScript/JavaScript do not support abstract base classes.
            //         This is just one way around, please convince me about a better solution.
            throw new Error('The TypeConverter.convert method is abstract. Use a TypeConverter extension class instead.');
        }
    }
}