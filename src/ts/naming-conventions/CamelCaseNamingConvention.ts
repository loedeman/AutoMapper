/// <reference path="../../../tools/typings/arcady-automapper.d.ts" />

module AutoMapperJs {
    'use strict';
	
	export class CamelCaseNamingConvention implements INamingConvention {
        public splittingExpression = /^[a-z]+(?=$|[A-Z]{1}[a-z0-9]+)|[A-Z]?[a-z0-9]+/;
        public separatorCharacter = '';
	}
}