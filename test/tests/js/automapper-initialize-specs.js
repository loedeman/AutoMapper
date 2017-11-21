/// <reference path="../../../tools/typings/jasmine/jasmine.d.ts" />
/// <reference path="../../typings/jasmine-utils.d.ts" />
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
/// <reference path="../../../dist/automapper-classes.d.ts" />
/// <reference path="../../../dist/automapper-interfaces.d.ts" />
/// <reference path="../../../dist/automapper-declaration.d.ts" />
var globalScope = this;
var AutoMapperJs;
(function (AutoMapperJs) {
    var PascalCaseToCamelCaseMappingProfile = /** @class */ (function (_super) {
        __extends(PascalCaseToCamelCaseMappingProfile, _super);
        function PascalCaseToCamelCaseMappingProfile() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.profileName = 'PascalCaseToCamelCase';
            return _this;
        }
        PascalCaseToCamelCaseMappingProfile.prototype.configure = function () {
            this.sourceMemberNamingConvention = new AutoMapperJs.PascalCaseNamingConvention();
            this.destinationMemberNamingConvention = new AutoMapperJs.CamelCaseNamingConvention();
            _super.prototype.createMap.call(this, 'a', 'b');
        };
        return PascalCaseToCamelCaseMappingProfile;
    }(AutoMapperJs.Profile));
    var ForAllMembersMappingProfile = /** @class */ (function (_super) {
        __extends(ForAllMembersMappingProfile, _super);
        function ForAllMembersMappingProfile(fromKey, toKey, forAllMembersMappingSuffix) {
            var _this = _super.call(this) || this;
            _this.profileName = 'ForAllMembers';
            _this._fromKey = fromKey;
            _this._toKey = toKey;
            _this._forAllMembersMappingSuffix = forAllMembersMappingSuffix;
            return _this;
        }
        ForAllMembersMappingProfile.prototype.configure = function () {
            var _this = this;
            _super.prototype.createMap.call(this, this._fromKey, this._toKey)
                .forMember('prop1', function (opts) { return opts.intermediatePropertyValue; })
                .forMember('prop2', function (opts) { return opts.intermediatePropertyValue; })
                .forAllMembers(function (destinationObject, destinationPropertyName, value) {
                destinationObject[destinationPropertyName] = value + _this._forAllMembersMappingSuffix;
            });
        };
        return ForAllMembersMappingProfile;
    }(AutoMapperJs.Profile));
    var ConvertUsingMappingProfile = /** @class */ (function (_super) {
        __extends(ConvertUsingMappingProfile, _super);
        function ConvertUsingMappingProfile(fromKey, toKey, convertUsingSuffix) {
            var _this = _super.call(this) || this;
            _this.profileName = 'ConvertUsing';
            _this._fromKey = fromKey;
            _this._toKey = toKey;
            _this._convertUsingSuffix = convertUsingSuffix;
            return _this;
        }
        ConvertUsingMappingProfile.prototype.configure = function () {
            var _this = this;
            _super.prototype.createMap.call(this, this._fromKey, this._toKey)
                .convertUsing(function (resolutionContext) {
                return {
                    prop1: resolutionContext.sourceValue.prop1 + _this._convertUsingSuffix,
                    prop2: resolutionContext.sourceValue.prop2 + _this._convertUsingSuffix
                };
            });
        };
        return ConvertUsingMappingProfile;
    }(AutoMapperJs.Profile));
    var CamelCaseToPascalCaseMappingProfile = /** @class */ (function (_super) {
        __extends(CamelCaseToPascalCaseMappingProfile, _super);
        function CamelCaseToPascalCaseMappingProfile() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.profileName = 'CamelCaseToPascalCase';
            return _this;
        }
        CamelCaseToPascalCaseMappingProfile.prototype.configure = function () {
            this.sourceMemberNamingConvention = new AutoMapperJs.CamelCaseNamingConvention();
            this.destinationMemberNamingConvention = new AutoMapperJs.PascalCaseNamingConvention();
        };
        return CamelCaseToPascalCaseMappingProfile;
    }(AutoMapperJs.Profile));
    var ValidatedAgeMappingProfile = /** @class */ (function (_super) {
        __extends(ValidatedAgeMappingProfile, _super);
        function ValidatedAgeMappingProfile() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.profileName = 'ValidatedAgeMappingProfile';
            return _this;
        }
        ValidatedAgeMappingProfile.prototype.configure = function () {
            var sourceKey = '{808D9D7F-AA89-4D07-917E-A528F078E642}';
            var destinationKey = '{808D9D6F-BA89-4D17-915E-A528E178EE64}';
            this.createMap(sourceKey, destinationKey)
                .forMember('proclaimedAge', function (opts) { return opts.ignore(); })
                .forMember('age', function (opts) { return opts.mapFrom('ageOnId'); })
                .convertToType(Person);
        };
        return ValidatedAgeMappingProfile;
    }(AutoMapperJs.Profile));
    var ValidatedAgeMappingProfile2 = /** @class */ (function (_super) {
        __extends(ValidatedAgeMappingProfile2, _super);
        function ValidatedAgeMappingProfile2() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.profileName = 'ValidatedAgeMappingProfile2';
            return _this;
        }
        ValidatedAgeMappingProfile2.prototype.configure = function () {
            var sourceKey = '{918D9D7F-AA89-4D07-917E-A528F07EEF42}';
            var destinationKey = '{908D9D6F-BA89-4D17-915E-A528E988EE64}';
            this.createMap(sourceKey, destinationKey)
                .forMember('proclaimedAge', function (opts) { return opts.ignore(); })
                .forMember('age', function (opts) { return opts.mapFrom('ageOnId'); })
                .convertToType(Person);
        };
        return ValidatedAgeMappingProfile2;
    }(AutoMapperJs.Profile));
    var Person = /** @class */ (function () {
        function Person() {
            this.fullName = null;
            this.age = null;
        }
        return Person;
    }());
    var BeerBuyingYoungster = /** @class */ (function (_super) {
        __extends(BeerBuyingYoungster, _super);
        function BeerBuyingYoungster() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return BeerBuyingYoungster;
    }(Person));
    describe('AutoMapper.initialize', function () {
        var postfix = ' [f0e5ef4a-ebe1-32c4-a3ed-48f8b5a5fac7]';
        beforeEach(function () {
            utils.registerTools(globalScope);
            utils.registerCustomMatchers(globalScope);
        });
        it('should use created mapping profile', function () {
            // arrange
            var fromKey = '{5700E351-8D88-A327-A216-3CC94A308EDE}';
            var toKey = '{BB33A261-3CA9-A8FC-85E6-2C269F73728C}';
            automapper.initialize(function (config) {
                config.createMap(fromKey, toKey);
            });
            // act
            automapper.map(fromKey, toKey, {});
            // assert
        });
        it('should be able to use a naming convention to convert Pascal case to camel case', function () {
            automapper.initialize(function (config) {
                config.addProfile(new PascalCaseToCamelCaseMappingProfile());
            });
            var sourceKey = 'PascalCase';
            var destinationKey = 'CamelCase';
            var sourceObject = { FullName: 'John Doe' };
            automapper
                .createMap(sourceKey, destinationKey)
                .withProfile('PascalCaseToCamelCase');
            var result = automapper.map(sourceKey, destinationKey, sourceObject);
            expect(result).toEqualData({ fullName: 'John Doe' });
        });
        it('should be able to use a naming convention to convert camelCase to PascalCase', function () {
            automapper.initialize(function (config) {
                config.addProfile(new CamelCaseToPascalCaseMappingProfile());
            });
            var sourceKey = 'CamelCase2';
            var destinationKey = 'PascalCase2';
            var sourceObject = { fullName: 'John Doe' };
            automapper
                .createMap(sourceKey, destinationKey)
                .withProfile('CamelCaseToPascalCase');
            var result = automapper.map(sourceKey, destinationKey, sourceObject);
            expect(result).toEqualData({ FullName: 'John Doe' });
        });
        it('should be able to use forMember besides using a profile', function () {
            automapper.initialize(function (config) {
                config.addProfile(new CamelCaseToPascalCaseMappingProfile());
            });
            var sourceKey = 'CamelCase';
            var destinationKey = 'PascalCase';
            var sourceObject = { fullName: 'John Doe', age: 20 };
            automapper
                .createMap(sourceKey, destinationKey)
                .forMember('theAge', function (opts) { return opts.mapFrom('age'); })
                .withProfile('CamelCaseToPascalCase');
            var result = automapper.map(sourceKey, destinationKey, sourceObject);
            expect(result).toEqualData({ FullName: 'John Doe', theAge: sourceObject.age });
        });
        it('should use profile when only profile properties are specified', function () {
            automapper.initialize(function (config) {
                config.addProfile(new ValidatedAgeMappingProfile2());
            });
            var sourceKey = '{918D9D7F-AA89-4D07-917E-A528F07EEF42}';
            var destinationKey = '{908D9D6F-BA89-4D17-915E-A528E988EE64}';
            var sourceObject = { fullName: 'John Doe', proclaimedAge: 21, ageOnId: 15 };
            automapper
                .createMap(sourceKey, destinationKey)
                .withProfile('ValidatedAgeMappingProfile2');
            var result = automapper.map(sourceKey, destinationKey, sourceObject);
            expect(result).toEqualData({ fullName: 'John Doe', age: sourceObject.ageOnId });
            expect(result instanceof Person).toBeTruthy();
            expect(result instanceof BeerBuyingYoungster).not.toBeTruthy();
        });
        it('should fail when using a non-existing profile', function () {
            // arrange
            var caught = false;
            var profileName = 'Non-existing profile';
            var sourceKey = 'should fail when using ';
            var destinationKey = 'a non-existing profile';
            var sourceObject = {};
            // act
            try {
                automapper
                    .createMap(sourceKey, destinationKey)
                    .withProfile(profileName);
                var result = automapper.map(sourceKey, destinationKey, sourceObject);
            }
            catch (e) {
                caught = true;
                // assert
                expect(e.message).toEqual('Could not find profile with profile name \'' + profileName + '\'.');
            }
            if (!caught) {
                // assert
                expect().fail('Using a non-existing mapping profile should result in an error.');
            }
        });
        it('should merge forMember calls when specifying the same destination property normally and using profile', function () {
            automapper.initialize(function (config) {
                config.addProfile(new ValidatedAgeMappingProfile());
            });
            var sourceKey = '{808D9D7F-AA89-4D07-917E-A528F078E642}';
            var destinationKey = '{808D9D6F-BA89-4D17-915E-A528E178EE64}';
            var sourceObject = { fullName: 'John Doe', proclaimedAge: 21, ageOnId: 15 };
            automapper
                .createMap(sourceKey, destinationKey)
                .forMember('ageOnId', function (opts) { return opts.ignore(); })
                .forMember('age', function (opts) { return opts.mapFrom('proclaimedAge'); })
                .convertToType(BeerBuyingYoungster)
                .withProfile('ValidatedAgeMappingProfile');
            var result = automapper.map(sourceKey, destinationKey, sourceObject);
            expect(result).toEqualData({ fullName: 'John Doe', age: sourceObject.ageOnId });
            expect(result instanceof Person).toBeTruthy();
            expect(result instanceof BeerBuyingYoungster).not.toBeTruthy();
        });
        it('should be able to use currying when calling initialize(cfg => cfg.createMap)', function () {
            // arrange
            var fromKey = '{808D9D7F-AA89-4D07-917E-A528F078EE64}';
            var toKey1 = '{B364C0A0-9E24-4424-A569-A4C14102147C}';
            var toKey2 = '{1055CA5A-4FC4-44CA-B4D8-B004F43D4440}';
            var source = { prop: 'Value' };
            // act
            var mapFromKeyCurry;
            automapper.initialize(function (config) {
                mapFromKeyCurry = config.createMap(fromKey);
                mapFromKeyCurry(toKey1)
                    .forSourceMember('prop', function (opts) {
                    opts.ignore();
                });
                mapFromKeyCurry(toKey2);
            });
            var result1 = automapper.map(fromKey, toKey1, source);
            var result2 = automapper.map(fromKey, toKey2, source);
            // assert
            expect(typeof mapFromKeyCurry === 'function').toBeTruthy();
            expect(result1.prop).toBeUndefined();
            expect(result2.prop).toEqual(source.prop);
        });
        it('should be able to use a mapping profile with forAllMemberMappings', function () {
            // arrange
            var fromKey = 'should be able to use a mapping profile ';
            var toKey = 'with forAllMemberMappings' + postfix;
            var source = { prop1: 'prop1', prop2: 'prop2' };
            var forAllMembersMappingSuffix = ' [forAllMembers]';
            automapper.initialize(function (config) {
                config.addProfile(new ForAllMembersMappingProfile(fromKey, toKey, forAllMembersMappingSuffix));
            });
            automapper
                .createMap(fromKey, toKey)
                .withProfile('ForAllMembers');
            // act
            var destination = automapper.map(fromKey, toKey, source);
            // assert
            expect(destination.prop1).toEqual(source.prop1 + forAllMembersMappingSuffix);
            expect(destination.prop2).toEqual(source.prop2 + forAllMembersMappingSuffix);
        });
        it('should be able to use a mapping profile with convertUsing', function () {
            // arrange
            var fromKey = 'should be able to use a mapping profile ';
            var toKey = 'with convertUsing' + postfix;
            var source = { prop1: 'prop1', prop2: 'prop2' };
            var convertUsingSuffix = ' [convertUsing]';
            automapper.initialize(function (config) {
                config.addProfile(new ConvertUsingMappingProfile(fromKey, toKey, convertUsingSuffix));
            });
            automapper
                .createMap(fromKey, toKey)
                .withProfile('ConvertUsing');
            // act
            var destination = automapper.map(fromKey, toKey, source);
            // assert
            expect(destination.prop1).toEqual(source.prop1 + convertUsingSuffix);
            expect(destination.prop2).toEqual(source.prop2 + convertUsingSuffix);
        });
    });
})(AutoMapperJs || (AutoMapperJs = {}));
