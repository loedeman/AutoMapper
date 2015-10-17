/// <reference path="../../dist/arcady-automapper-interfaces.d.ts" />
/// <reference path="TypeConverter.ts" />
/// <reference path="AutoMapperHelper.ts" />
/// <reference path="AutoMapperValidator.ts" />

module AutoMapperJs {
    'use strict';

    type ICMChainFunc = IAutoMapperCreateMapChainingFunctions;

    /**
     * AutoMapper implementation, for both creating maps and performing maps. Comparable usage and functionality to the original
     * .NET AutoMapper library is the pursuit of this implementation.
     */
    export class AutoMapperBase {
        protected getMapping(mappings: { [key: string]: IMapping }, sourceKey: string | (new () => any), destinationKey: string | (new () => any)): IMapping {
            let srcKey = this.getKey(sourceKey);
            let dstKey = this.getKey(destinationKey);
            let mapping: IMapping = mappings[srcKey + dstKey];

            if (!mapping) {
                throw new Error(`Could not find map object with a source of ${srcKey} and a destination of ${dstKey}`);
            }
            return mapping;
        }

        protected getKey(keyStringOrType: string | (new () => any)): string {
            if (typeof keyStringOrType === 'string') {
                return keyStringOrType;
            } else {
                return AutoMapperHelper.getClassName(keyStringOrType);
            }
        }

        protected isArray(sourceObject: any): boolean {
            return sourceObject instanceof Array;
        }

        protected handleArray(mapping: IMapping, sourceArray: Array<any>, itemFunc: (sourceObject: any, destinationObject: any) => void): Array<any> {
            var arrayLength = sourceArray.length;
            var destinationArray = new Array<any>(sourceArray.length);

            for (let index = 0; index < arrayLength; index++) {
                let sourceObject = sourceArray[index];
                let destinationObject: any;

                if (sourceObject === null || sourceObject === undefined) {
                    destinationObject = sourceObject;
                } else {
                    destinationObject = this.createDestinationObject(mapping.destinationTypeClass);
                    itemFunc(sourceObject, destinationObject);
                }

                destinationArray[index] = destinationObject;
            }

            return destinationArray;
        }

        protected handleItem(mapping: IMapping, sourceObject: any, destinationObject: any, propertyFunction: (propertyName: string) => void): any {
            for (let sourcePropertyName in sourceObject) {
                if (!sourceObject.hasOwnProperty(sourcePropertyName)) {
                    continue;
                }

                propertyFunction(sourcePropertyName);
            }

            return destinationObject;
        }

        protected handleProperty(mapping: IMapping,
                                 sourceObject: any,
                                 sourcePropertyName: string,
                                 destinationObject: any,
                                 loopMemberValuesAndFunctions: (destinationProperty: string, valuesAndFunctions: Array<any>, opts: IMemberConfigurationOptions) => void): void {
            var propertyMapping = mapping.forMemberMappings[sourcePropertyName];
            if (propertyMapping) {
                // a forMember mapping exists

                var {
                    ignore,
                    conditionFunction,
                    destinationProperty,
                    mappingValuesAndFunctions
                } = propertyMapping;

                // ignore ignored properties
                if (ignore) {
                    return;
                }

                // check for condition function
                if (conditionFunction) {
                    // and, if there, return when the condition is not met.
                    if (conditionFunction(sourceObject) === false) {
                        return;
                    }
                }

                var memberConfigurationOptions: IMemberConfigurationOptions = {
                    mapFrom: (): void => {//sourceMemberKey: string) {
                        // no action required, just here as a stub to prevent calling a non-existing 'opts.mapFrom()' function.
                    },
                    condition: (predicate: ((sourceObject: any) => boolean)): void => {
                        // no action required, just here as a stub to prevent calling a non-existing 'opts.mapFrom()' function.
                    },
                    sourceObject: sourceObject,
                    sourcePropertyName: sourcePropertyName,
                    intermediatePropertyValue: sourceObject[sourcePropertyName]
                };

                loopMemberValuesAndFunctions(propertyMapping.destinationProperty, mappingValuesAndFunctions, memberConfigurationOptions);
            } else {
                // no forMember mapping exists, auto map properties ...

                // ... except for the situation where ignoreAllNonExisting is specified.
                if (mapping.ignoreAllNonExisting) {
                    return;
                }

                // use profile mapping when specified; otherwise, specify source property name as destination property name.
                let destinationPropertyName = this.getDestinationPropertyName(mapping.profile, sourcePropertyName);
                this.setPropertyValue(mapping, destinationObject, destinationPropertyName, sourceObject[sourcePropertyName]);
            }
        }

        protected setPropertyValue(mapping: IMapping, destinationObject: any, destinationProperty: string, destinationPropertyValue: any): void {
            if (mapping.forAllMemberMappings.length > 0) {
                for (let forAllMemberMapping of mapping.forAllMemberMappings) {
                    forAllMemberMapping(destinationObject, destinationProperty, destinationPropertyValue);
                }
            } else {
                destinationObject[destinationProperty] = destinationPropertyValue;
            }
        }

        protected createDestinationObject(destinationType: new () => any): any {
            // create empty destination object.
            return destinationType
                ? new destinationType()
                : {};
        }

        private getDestinationPropertyName(profile: IProfile, sourcePropertyName: string): string {
            if (!profile) {
                return sourcePropertyName;
            }

            // TODO BL no support yet for INamingConvention.splittingCharacter

            try {
                // First, split the source property name based on the splitting expression.
                // TODO BL Caching of RegExp splitting!
                var sourcePropertyNameParts = sourcePropertyName.split(profile.sourceMemberNamingConvention.splittingExpression);

                // NOTE BL For some reason, splitting by (my ;)) RegExp results in empty strings in the array; remove them.
                for (let index = sourcePropertyNameParts.length - 1; index >= 0; index--) {
                    if (sourcePropertyNameParts[index] === '') {
                        sourcePropertyNameParts.splice(index, 1);
                    }
                }

                return profile.destinationMemberNamingConvention.transformPropertyName(sourcePropertyNameParts);
            } catch (error) {
                return sourcePropertyName;
            }
        }
    }
}