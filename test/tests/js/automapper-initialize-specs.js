/// <reference path="../../../tools/typings/jasmine/jasmine.d.ts" />
/// <reference path="../../typings/jasmine-utils.d.ts" />
var _this = this;
/// <reference path="../../../src/ts/automapper.ts" />
/// <reference path="../../../tools/typings/arcady-automapper.d.ts" />
/// <reference path="../../../src/ts/naming-conventions/PascalCaseNamingConvention.ts" />
/// <reference path="../../../src/ts/naming-conventions/CamelCaseNamingConvention.ts" />
var PascalCaseToCamelCaseMappingProfile = (function () {
    function PascalCaseToCamelCaseMappingProfile() {
        this.sourceMemberNamingConvention = new AutoMapperJs.PascalCaseNamingConvention();
        this.destinationMemberNamingConvention = new AutoMapperJs.CamelCaseNamingConvention();
        this.profileName = 'PascalCaseToCamelCase';
    }
    return PascalCaseToCamelCaseMappingProfile;
})();
describe('AutoMapper.initialize', function () {
    beforeEach(function () {
        utils.registerTools(_this);
        utils.registerCustomMatchers(_this);
    });
    it('should be able to use a custom naming convention', function () {
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
    // it('should be able to use a custom naming convention', () => {
    //     expect().fail('snik');
    // });
});
