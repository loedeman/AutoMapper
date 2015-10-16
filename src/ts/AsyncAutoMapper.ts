/// <reference path="../../dist/arcady-automapper-interfaces.d.ts" />
/// <reference path="AutoMapper.ts" />
/// <reference path="TypeConverter.ts" />
/// <reference path="AutoMapperHelper.ts" />
/// <reference path="AutoMapperValidator.ts" />

module AutoMapperJs {
    'use strict';

    /**
     * AutoMapper implementation, for both creating maps and performing maps. Comparable usage and functionality to the original
     * .NET AutoMapper library is the pursuit of this implementation.
     */
    export class AsyncAutoMapper extends AutoMapper {
        private static asyncInstance = new AsyncAutoMapper();

        /**
         * Creates a new AutoMapper instance. This class is intended to be a Singleton.
         * Do not use the constructor directly from code. Use getInstance() function instead.
         * @constructor
         */
        constructor() {
			super();
            AsyncAutoMapper.asyncInstance = this;
        }

        /**
         * Gets AutoMapper Singleton instance.
         * @returns {Core.AutoMapper}
         */
        public static getInstance(): AsyncAutoMapper {
            return AsyncAutoMapper.asyncInstance;
        }

        public mapAsyncInternal(mapping: IMapping, sourceObject: any, callback: IMapCallback): void {
            //callback('No implementation yet...');
            throw new Error('No implementation yet...');
        }
	}
}