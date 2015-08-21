/// <reference path="../../../tools/typings/arcady-automapper.d.ts" />

module AutoMapperJs {
    'use strict';
	
	export class PascalCaseNamingConvention implements INamingConvention {
        public splittingExpression = /[A-Z]+(?=$|[A-Z]{1}[a-z0-9]+)|[A-Z]?[a-z0-9]+/;
        public separatorCharacter = '';
	}
}