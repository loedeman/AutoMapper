/// <reference path="../../dist/automapper-interfaces.d.ts" />
/// <reference path="../../src/ts/AutoMapper.ts" />

module AutoMapperJs {
    'use strict';

    /**
     * Converts source type to destination type instead of normal member mapping
     */
    export class Profile implements IProfile {
        /** Profile name */
        public profileName: string;

        /** Naming convention for source members */
        public sourceMemberNamingConvention: INamingConvention;

        /** Naming convention for destination members */
        public destinationMemberNamingConvention: INamingConvention;

        /**
         * Implement this method in a derived class and call the CreateMap method to associate that map with this profile.
         * Avoid calling the AutoMapper class / automapper instance from this method.
         */
        public configure(): void {
            // do nothing
        }

        /**
         * Create a mapping profile.
         * @param {string} sourceKey The map source key.
         * @param {string} destinationKey The map destination key.
         * @returns {Core.ICreateMapFluentFunctions}
         */
        protected createMap(sourceKey: string, destinationKey: string): ICreateMapFluentFunctions {
            var argsCopy = Array.prototype.slice.apply(arguments);

            for (var index = 0, length = argsCopy.length; index < length; index++) {
                if (argsCopy[index]) {
                    // prefix sourceKey and destinationKey with 'profileName=>'
                    argsCopy[index] = `${this.profileName}=>${argsCopy[index]}`;
                }
            }

            // pass through using arguments to keep createMap's currying support fully functional.
            return automapper.createMap.apply(automapper, argsCopy);
        }
    }
}