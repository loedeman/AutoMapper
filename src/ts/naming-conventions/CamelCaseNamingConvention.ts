/// <reference path="../../../dist/automapper-interfaces.d.ts" />

module AutoMapperJs {
    'use strict';

	export class CamelCaseNamingConvention implements INamingConvention {
        public splittingExpression = /(^[a-z]+(?=$|[A-Z]{1}[a-z0-9]+)|[A-Z]?[a-z0-9]+)/;
        public separatorCharacter = '';

		public transformPropertyName(sourcePropertyNameParts: string[]): string {
            // Transform the splitted parts.
            var result = '';

            for (var index = 0, length = sourcePropertyNameParts.length; index < length; index++) {
 				if (index === 0) {
                    result += sourcePropertyNameParts[index].charAt(0).toLowerCase() +
                            sourcePropertyNameParts[index].substr(1);
				} else {
                result += sourcePropertyNameParts[index].charAt(0).toUpperCase() +
                          sourcePropertyNameParts[index].substr(1);
                }
            }

            return result;
        }
	}
}