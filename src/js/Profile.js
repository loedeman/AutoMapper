/// <reference path="../../dist/automapper-interfaces.d.ts" />
/// <reference path="../../src/ts/AutoMapper.ts" />
var AutoMapperJs;
(function (AutoMapperJs) {
    'use strict';
    /**
     * Converts source type to destination type instead of normal member mapping
     */
    var Profile = (function () {
        function Profile() {
        }
        /**
         * Implement this method in a derived class and call the CreateMap method to associate that map with this profile.
         * Avoid calling the AutoMapper class / automapper instance from this method.
         */
        Profile.prototype.configure = function () {
            // do nothing
        };
        /**
         * Create a mapping profile.
         * @param {string} sourceKey The map source key.
         * @param {string} destinationKey The map destination key.
         * @returns {Core.ICreateMapFluentFunctions}
         */
        Profile.prototype.createMap = function (sourceKey, destinationKey) {
            var argsCopy = Array.prototype.slice.apply(arguments);
            for (var index = 0, length = argsCopy.length; index < length; index++) {
                if (!argsCopy[index]) {
                    continue;
                }
                // prefix sourceKey and destinationKey with 'profileName=>'
                argsCopy[index] = this.profileName + "=>" + argsCopy[index];
            }
            // pass through using arguments to keep createMap's currying support fully functional.
            return automapper.createMap.apply(automapper, argsCopy);
        };
        return Profile;
    }());
    AutoMapperJs.Profile = Profile;
})(AutoMapperJs || (AutoMapperJs = {}));

//# sourceMappingURL=Profile.js.map
