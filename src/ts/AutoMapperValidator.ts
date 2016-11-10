/// <reference path="../../dist/automapper-interfaces.d.ts" />
/// <reference path="AutoMapperHelper.ts" />
module AutoMapperJs {
    'use strict';

    /**
     * AutoMapper configuration validator.
     */
    export class AutoMapperValidator {
        /**
         * Validates mapping configuration by dry-running. Since JS does not
         * fully support typing, it only checks if properties match on both
         * sides. The function needs IMapping.sourceTypeClass and 
         * IMapping.destinationTypeClass to function.
         * @param {boolean} strictMode Whether or not to fail when properties
         *                             sourceTypeClass or destinationTypeClass
         *                             are unavailable. 
         */
        public static assertConfigurationIsValid(mappings: any, strictMode: boolean): void {
            for (var key in mappings) {
                if (!mappings.hasOwnProperty(key)) {
                    continue;
                }

                AutoMapperValidator.assertMappingConfiguration(mappings[key], strictMode);
            }
        }

        private static assertMappingConfiguration(mapping: IMapping, strictMode: boolean): void {
            var mappingKey = `${mapping.sourceKey}=>${mapping.destinationKey}`;

            var sourceType = mapping.sourceTypeClass;
            var destinationType = mapping.destinationTypeClass;

            var sourceClassName = sourceType ? AutoMapperHelper.getClassName(sourceType) : undefined;
            var destinationClassName = destinationType ? AutoMapperHelper.getClassName(destinationType) : undefined;

            if (!sourceType || !destinationType) {
                if (strictMode === false) {
                    return;
                }

                throw new Error(`Mapping '${mappingKey}' cannot be validated, since mapping.sourceType or mapping.destinationType are unspecified.`);
            }

            var tryHandle = (errorMessage: string) => {
                if (errorMessage) {
                    throw new Error(`Mapping '${mappingKey}' is invalid: ${errorMessage} (source: '${sourceClassName}', destination: '${destinationClassName}').`);
                }
            };

            var validatedMembers = new Array<string>();

            var srcObj = new sourceType();
            var dstObj = new destinationType();

            // walk member mappings
            for (let property of mapping.properties) {


                tryHandle(AutoMapperValidator.validatePropertyMapping(property, property.name, srcObj, dstObj));
                validatedMembers.push(property.name);
            }

            // walk source members
            for (let srcMember in srcObj) {
                if (!srcObj.hasOwnProperty(srcMember)) {
                    continue;
                }

                if (validatedMembers.indexOf(srcMember) >= 0) {
                   // already validated
                   continue;
                }

                tryHandle(AutoMapperValidator.validateProperty(srcMember, dstObj));
                validatedMembers.push(srcMember);
            }

            // walk destination members
            for (let dstMember in dstObj) {
                if (!dstObj.hasOwnProperty(dstMember)) {
                    continue;
                }

                if (validatedMembers.indexOf(dstMember) >= 0) {
                   // already validated
                   continue;
                }

                tryHandle(`Destination member '${dstMember}' does not exist on source type`);
            }
            // /* tslint:disable */
            // console.error(key);
            // /* tslint:enable */            
        }

        private static validatePropertyMapping(propertyMapping: IProperty, member: any, srcObj: any, dstObj: any): string {
            return propertyMapping.sourceMapping
                ? AutoMapperValidator.validateSourcePropertyMapping(propertyMapping, member, srcObj, dstObj)
                : AutoMapperValidator.validateDestinationPropertyMapping(propertyMapping, member, srcObj, dstObj);
        }

        private static validateSourcePropertyMapping(propertyMapping: IProperty, member: any, srcObj: any, dstObj: any): string {
            // a member for which configuration is provided, should exist.
            if (!srcObj.hasOwnProperty(member)) {
                return `Source member '${member}' is configured, but does not exist on source type`;
            }

            // an ignored source member should not exist on the destination type. 
            if (propertyMapping.ignore) {
                if (dstObj.hasOwnProperty(member)) {
                    return `Source member '${member}' is ignored, but does exist on destination type`;
                }
                return undefined;
            }

            // a mapped source member should exist on the destination type.
            if (!dstObj.hasOwnProperty(member)) {
                return `Source member '${member}' is configured to be mapped, but does not exist on destination type`;
            }

            //var dstMember = propertyMapping.destinationProperty;

            return undefined;
        }

        private static validateDestinationPropertyMapping(propertyMapping: IProperty, member: any, srcObj: any, dstObj: any): string {
            // a member for which configuration is provided, should exist.
            if (!dstObj.hasOwnProperty(member)) {
                return `Destination member '${member}' is configured, but does not exist on destination type`;
            }

            // an ignored destination member should not exist on the source type. 
            if (propertyMapping.ignore) {
                if (srcObj.hasOwnProperty(member)) {
                    return `Destination member '${member}' is ignored, but does exist on source type`;
                }
                return undefined;
            }

            // a mapped destination member should exist on the source type.
            if (!srcObj.hasOwnProperty(member)) {
                return `Destination member '${member}' is configured to be mapped, but does not exist on source type`;
            }

            //var dstMember = propertyMapping.destinationProperty;

            return undefined;
        }

        private static validateProperty(srcMember: any, dstObj: any): string {
            if (!dstObj.hasOwnProperty(srcMember)) {
                return `Source member '${srcMember}' is configured to be mapped, but does not exist on destination type`;
            }

            return undefined;
        }
    }
}