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
});
