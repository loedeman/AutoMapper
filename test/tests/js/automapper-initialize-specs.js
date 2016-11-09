/// <reference path="../../../tools/typings/jasmine/jasmine.d.ts" />
/// <reference path="../../typings/jasmine-utils.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="../../../dist/automapper-classes.d.ts" />
/// <reference path="../../../dist/automapper-interfaces.d.ts" />
/// <reference path="../../../dist/automapper-declaration.d.ts" />
var globalScope = this;
var AutoMapperJs;
(function (AutoMapperJs) {
    var PascalCaseToCamelCaseMappingProfile = (function (_super) {
        __extends(PascalCaseToCamelCaseMappingProfile, _super);
        function PascalCaseToCamelCaseMappingProfile() {
            _super.apply(this, arguments);
            this.profileName = 'PascalCaseToCamelCase';
        }
        PascalCaseToCamelCaseMappingProfile.prototype.configure = function () {
            this.sourceMemberNamingConvention = new AutoMapperJs.PascalCaseNamingConvention();
            this.destinationMemberNamingConvention = new AutoMapperJs.CamelCaseNamingConvention();
            _super.prototype.createMap.call(this, 'a', 'b');
        };
        return PascalCaseToCamelCaseMappingProfile;
    }(AutoMapperJs.Profile));
    var CamelCaseToPascalCaseMappingProfile = (function (_super) {
        __extends(CamelCaseToPascalCaseMappingProfile, _super);
        function CamelCaseToPascalCaseMappingProfile() {
            _super.apply(this, arguments);
            this.profileName = 'CamelCaseToPascalCase';
        }
        CamelCaseToPascalCaseMappingProfile.prototype.configure = function () {
            this.sourceMemberNamingConvention = new AutoMapperJs.CamelCaseNamingConvention();
            this.destinationMemberNamingConvention = new AutoMapperJs.PascalCaseNamingConvention();
        };
        return CamelCaseToPascalCaseMappingProfile;
    }(AutoMapperJs.Profile));
    // class ComplexObjectToSimpleObject extends Profile {
    //     public profileName = 'ComplexObjectToSimpleObject';
    //
    //     public configure() {
    //         alert('Complex configuration');
    //         super.createMap('complex', 'simple');
    //     }
    // }
    var ValidatedAgeMappingProfile = (function (_super) {
        __extends(ValidatedAgeMappingProfile, _super);
        function ValidatedAgeMappingProfile() {
            _super.apply(this, arguments);
            this.profileName = 'ValidatedAgeMappingProfile';
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
    var ValidatedAgeMappingProfile2 = (function (_super) {
        __extends(ValidatedAgeMappingProfile2, _super);
        function ValidatedAgeMappingProfile2() {
            _super.apply(this, arguments);
            this.profileName = 'ValidatedAgeMappingProfile2';
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
    var Person = (function () {
        function Person() {
            this.fullName = null;
            this.age = null;
        }
        return Person;
    }());
    var BeerBuyingYoungster = (function (_super) {
        __extends(BeerBuyingYoungster, _super);
        function BeerBuyingYoungster() {
            _super.apply(this, arguments);
        }
        return BeerBuyingYoungster;
    }(Person));
    describe('AutoMapper.initialize', function () {
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
        it('should fail when using a non-existimg profile', function () {
            // arrange
            var caught = false;
            var profileName = 'Non-existing profile';
            var sourceKey = 'should fail when using ';
            var destinationKey = 'a non-existimg profile';
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
        // it('should be able to convert Complex Objects to Simple Objects', ()=> {
        //     automapper.initialize((config: IConfiguration) => {
        //         config.addProfile(new ComplexObjectToSimpleObject());
        //     });
        //
        //     const sourceKey = '{74d523ee-8dbb-4e72-bdf1-db8fa3b27d07}';
        //     const destinationKey = '{cf7bbaa0-14f9-400d-a59a-65313651db6b}';
        //
        //     automapper
        //         .createMap(sourceKey, destinationKey)
        //         .withProfile('ValidatedAgeMappingProfile');
        //
        //
        //
        // });
    });
})(AutoMapperJs || (AutoMapperJs = {}));
