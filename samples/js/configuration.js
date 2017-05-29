/// <reference path="../../dist/automapper-classes.d.ts" />
/// <reference path="../../dist/automapper-interfaces.d.ts" />
/// <reference path="../../dist/automapper-declaration.d.ts" />
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var AutoMapperJs;
(function (AutoMapperJs) {
    var Samples;
    (function (Samples) {
        'use strict';
        var Base = (function () {
            function Base() {
            }
            return Base;
        }());
        Samples.Base = Base;
        var Person = (function (_super) {
            __extends(Person, _super);
            function Person() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return Person;
        }(Base));
        Samples.Person = Person;
        var MappingProfile = (function () {
            function MappingProfile() {
                this.sourceMemberNamingConvention = new AutoMapperJs.PascalCaseNamingConvention();
                this.destinationMemberNamingConvention = new AutoMapperJs.CamelCaseNamingConvention();
                this.profileName = 'PascalCaseToCamelCase';
            }
            MappingProfile.prototype.configure = function () {
                this.sourceMemberNamingConvention = new AutoMapperJs.PascalCaseNamingConvention();
                this.destinationMemberNamingConvention = new AutoMapperJs.CamelCaseNamingConvention();
            };
            return MappingProfile;
        }());
        var InitializeSamples = (function () {
            function InitializeSamples() {
            }
            InitializeSamples.initialize = function () {
                automapper.initialize(function (cfg) {
                    cfg.addProfile(new MappingProfile());
                });
                var sourceKey = 'initialize';
                var destinationKey = '{}';
                var sourceObject = { FullName: 'John Doe' };
                automapper
                    .createMap(sourceKey, destinationKey)
                    .withProfile('PascalCaseToCamelCase');
                var result = automapper.map(sourceKey, destinationKey, sourceObject);
                return result;
            };
            return InitializeSamples;
        }());
        Samples.InitializeSamples = InitializeSamples;
        var ForMemberSamples = (function () {
            function ForMemberSamples() {
            }
            ForMemberSamples.simpleMapFrom = function () {
                var sourceKey = 'simpleMapFrom';
                var destinationKey = '{}';
                var sourceObject = { fullName: 'John Doe' };
                automapper
                    .createMap(sourceKey, destinationKey)
                    .forMember('name', function (opts) { return opts.mapFrom('fullName'); });
                var result = automapper.map(sourceKey, destinationKey, sourceObject);
                return result;
            };
            ForMemberSamples.stackedForMemberCalls = function () {
                var sourceKey = 'stackedForMemberCalls';
                var destinationKey = 'Person';
                var sourceObject = { birthdayString: '2000-01-01T00:00:00.000Z' };
                automapper
                    .createMap(sourceKey, destinationKey)
                    .forMember('birthday', function (opts) { return opts.mapFrom('birthdayString'); })
                    .forMember('birthday', function (opts) { return new Date(opts.sourceObject[opts.sourcePropertyName]); });
                var result = automapper.map(sourceKey, destinationKey, sourceObject);
                return result;
            };
            return ForMemberSamples;
        }());
        Samples.ForMemberSamples = ForMemberSamples;
    })(Samples = AutoMapperJs.Samples || (AutoMapperJs.Samples = {}));
})(AutoMapperJs || (AutoMapperJs = {}));

//# sourceMappingURL=configuration.js.map
