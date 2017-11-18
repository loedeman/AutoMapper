/// <reference path="../../dist/automapper-interfaces.d.ts" />
/// <reference path="TypeConverter.ts" />
/// <reference path="AutoMapperHelper.ts" />
/// <reference path="AutoMapperValidator.ts" />

module AutoMapperJs {
    'use strict';

    // interface shorthands
    type IFluentFunc = ICreateMapFluentFunctions;
    type IDMCO = IMemberConfigurationOptions;
    type ISMCO = ISourceMemberConfigurationOptions;

    type stringOrClass = string | (new () => any);

    /**
     * AutoMapper implementation, for both creating maps and performing maps. Comparable usage and functionality to the original
     * .NET AutoMapper library is the pursuit of this implementation.
     */
    export abstract class AutoMapperBase {

        public abstract map(sourceKeyOrType: any, destinationKeyOrType: any, sourceObject: any): any;

        public abstract createMap(sourceKeyOrType: string | (new () => any), destinationKeyOrType: string | (new () => any)): any;

        protected getMapping(mappings: { [key: string]: IMapping }, sourceKey: stringOrClass, destinationKey: stringOrClass): IMapping {
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
            // var sourceProperties: string[] = [];
            var atLeastOnePropertyMapped = false;

            // handle mapped properties ...
            for (let property of mapping.properties) {
                // sourceProperties.push(property.name);

                atLeastOnePropertyMapped = true;
                propertyFunction(property.name);
            }

            // .. and, after that, handle unmapped properties
            for (let sourcePropertyName in sourceObject) {
                if (!sourceObject.hasOwnProperty(sourcePropertyName)) {
                    continue;
                }

                atLeastOnePropertyMapped = true;
                propertyFunction(sourcePropertyName);
            }

            // return null/undefined sourceObject if no properties added
            if (!atLeastOnePropertyMapped && (sourceObject === null || sourceObject === undefined)) {
                return sourceObject;
            }

            return destinationObject;
        }

        protected handleProperty(
            mapping: IMapping,
            sourceObject: any,
            sourcePropertyName: string,
            destinationObject: any,
            transformFunction: (destinationProperty: IDestinationProperty, memberOptions: IDMCO, callback?: IMemberCallback) => void,
            autoMappingCallbackFunction?: (dstPropVal: any) => void): void {

            // TODO Property mappings are already located before
            // TODO handleProperty seems only to be called when processing a mapped property.
            var propertyMappings = this.getPropertyMappings(mapping.properties, sourcePropertyName);
            if (propertyMappings.length > 0) {
                for (let propertyMapping of propertyMappings) {
                    this.processMappedProperty(mapping, propertyMapping, sourceObject, sourcePropertyName, transformFunction);
                }
            } else {
                this.handlePropertyWithAutoMapping(mapping, sourceObject, sourcePropertyName, destinationObject, autoMappingCallbackFunction);
            }
        }

        protected setPropertyValue(mapping: IMapping, destinationProperty: IDestinationProperty, destinationObject: any, destinationPropertyValue: any): void {
            if (mapping.forAllMemberMappings.length > 0) {
                for (let forAllMemberMapping of mapping.forAllMemberMappings) {
                    forAllMemberMapping(destinationObject, destinationProperty.name, destinationPropertyValue);
                }
            } else {
                destinationObject[destinationProperty.name] = destinationPropertyValue;
            }
        }

        protected setPropertyValueByName(mapping: IMapping, destinationObject: any, destinationProperty: string, destinationPropertyValue: any): void {
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

        protected shouldProcessDestination(destination: IDestinationProperty, sourceObject: any): boolean {
            if (destination.ignore) {
                // ignore ignored properties
                return false;
            }

            if (destination.conditionFunction) {
                // check for condition function, and, if there is ...
                if (destination.conditionFunction(sourceObject) === false) {
                    // ... return when the condition is not met.
                    return false;
                }
            }

            return true;
        }

        // protected throwMappingException(propertyMapping: IProperty, message: string): void {
        //     throw new Error(`Cannot map '${propertyMapping.sourcePropertyName}' to '${propertyMapping.destinationPropertyName}' => ${message}`);
        // }

        private handlePropertyWithAutoMapping(mapping: IMapping,
            sourceObject: any,
            sourcePropertyName: string,
            destinationObject: any,
            autoMappingCallbackFunction?: (dstPropVal: any) => void): void {
            // no forMember mapping exists, auto map properties, except for the situation where ignoreAllNonExisting is specified.
            if (mapping.ignoreAllNonExisting) {
                return;
            }

            if (mapping.destinationTypeClass && Object.keys(destinationObject).indexOf(sourcePropertyName) < 0) {
                return;
            }

            let objectValue: any = null;
            let isNestedObject = false;

            if (typeof destinationObject[sourcePropertyName] === 'object' && destinationObject[sourcePropertyName]) {
                isNestedObject = (destinationObject[sourcePropertyName].constructor.name !== 'Object');

                if (isNestedObject) {
                    this
                        .createMap(sourceObject[sourcePropertyName].constructor.name, destinationObject[sourcePropertyName].constructor.name)
                        .convertToType(destinationObject[sourcePropertyName].constructor);

                    objectValue = this.map(
                        sourceObject[sourcePropertyName].constructor.name,
                        destinationObject[sourcePropertyName].constructor.name,
                        sourceObject[sourcePropertyName]
                    );
                }
            }

            // use profile mapping when specified; otherwise, specify source property name as destination property name.
            let destinationPropertyName = this.getDestinationPropertyName(mapping.profile, sourcePropertyName);
            let destinationPropertyValue = this.getDestinationPropertyValue(sourceObject, sourcePropertyName, objectValue, isNestedObject);
            this.setPropertyValueByName(mapping, destinationObject, destinationPropertyName, destinationPropertyValue);
            if (autoMappingCallbackFunction) {
                autoMappingCallbackFunction(destinationPropertyValue);
            }
        }

        private getDestinationPropertyValue(sourceObject: any,
            sourcePropertyName: string,
            objectValue: any,
            isNestedObject: boolean): any {
            if (isNestedObject) {
                return objectValue;
            }

            return sourceObject ? sourceObject[sourcePropertyName] : null;

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

        private getPropertyMappings(properties: ISourceProperty[], sourcePropertyName: string): ISourceProperty[] {
            var result = <ISourceProperty[]>[];
            for (let property of properties) {
                if (property.name === sourcePropertyName) {
                    result.push(property);
                }
            }
            return result;
        }

        private processMappedProperty(mapping: IMapping,
            propertyMapping: ISourceProperty,
            sourceObject: any,
            sourcePropertyName: string,
            transformFunction: (destinationProperty: IDestinationProperty, memberOptions: IDMCO) => void): void {
            if (propertyMapping.children && propertyMapping.children.length > 0) {
                // always pass child source object, even if source object does not exist =>
                // constant transformations should always pass.
                var childSourceObject = sourceObject ? sourceObject[propertyMapping.name] : null;
                for (let child of propertyMapping.children) {
                    this.processMappedProperty(mapping, child, childSourceObject, child.name, transformFunction);
                    return;
                }
            }

            var destination = propertyMapping.destination;
            // if (!propertyMapping.destination) {
            //     // it makes no sense to handle a property without destination(s).
            //     this.throwMappingException(propertyMapping, 'no destination object');
            // }

            let configurationOptions = this.createMemberConfigurationOptions(sourceObject, sourcePropertyName);
            transformFunction(destination, configurationOptions);
        }

        private createMemberConfigurationOptions(sourceObject: any, sourcePropertyName: string): IMemberConfigurationOptions {
            var memberConfigurationOptions = {
                mapFrom: (sourcePropertyName: string): void => {
                    // no action required, just here as a stub to prevent calling a non-existing 'opts.mapFrom(...)' function.
                },
                condition: (predicate: ((sourceObject: any) => boolean)): void => {
                    // no action required, just here as a stub to prevent calling a non-existing 'opts.condition(...)' function.
                },
                ignore: (): void => {
                    // no action required, just here as a stub to prevent calling a non-existing 'opts.ignore()' function.
                },
                sourceObject: sourceObject,
                sourcePropertyName: sourcePropertyName,
                intermediatePropertyValue: sourceObject ? sourceObject[sourcePropertyName] : sourceObject
            };
            return memberConfigurationOptions;
        }
    }
}
