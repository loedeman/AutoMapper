/// <reference path="../../../tools/typings/jasmine/jasmine.d.ts" />
/// <reference path="../../typings/jasmine-utils.d.ts" />
var _this = this;
/// <reference path="../../../dist/arcady-automapper-classes.d.ts" />
/// <reference path="../../../dist/arcady-automapper-interfaces.d.ts" />
/// <reference path="../../../dist/arcady-automapper-declaration.d.ts" />
var PascalCaseToCamelCaseMappingProfile = (function () {
    function PascalCaseToCamelCaseMappingProfile() {
        this.sourceMemberNamingConvention = new AutoMapperJs.PascalCaseNamingConvention();
        this.destinationMemberNamingConvention = new AutoMapperJs.CamelCaseNamingConvention();
        this.profileName = 'PascalCaseToCamelCase';
    }
    return PascalCaseToCamelCaseMappingProfile;
})();
var CamelCaseToPascalCaseMappingProfile = (function () {
    function CamelCaseToPascalCaseMappingProfile() {
        this.sourceMemberNamingConvention = new AutoMapperJs.CamelCaseNamingConvention();
        this.destinationMemberNamingConvention = new AutoMapperJs.PascalCaseNamingConvention();
        this.profileName = 'CamelCaseToPascalCase';
    }
    return CamelCaseToPascalCaseMappingProfile;
})();
describe('AutoMapper.initialize', function () {
    beforeEach(function () {
        utils.registerTools(_this);
        utils.registerCustomMatchers(_this);
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
            .withProfile('CamelCaseToPascalCase')
            .forMember('theAge', function (opts) { return opts.mapFrom('age'); });
        var result = automapper.map(sourceKey, destinationKey, sourceObject);
        expect(result).toEqualData({ FullName: 'John Doe', theAge: sourceObject.age });
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
            mapFromKeyCurry = config.createMap(fromKey); // TypeScript does not support function overloads 
            mapFromKeyCurry(toKey1)
                .forSourceMember('prop', function (opts) { opts.ignore(); });
            mapFromKeyCurry(toKey2);
        });
        var result1 = automapper.map(fromKey, toKey1, source);
        var result2 = automapper.map(fromKey, toKey2, source);
        // assert
        expect(typeof mapFromKeyCurry === 'function').toBeTruthy();
        expect(result1.prop).toBeUndefined();
        expect(result2.prop).toEqual(source.prop);
    });
});
