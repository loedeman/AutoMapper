/// <reference path="../../../tools/typings/jasmine/jasmine.d.ts" />
/// <reference path="../../typings/jasmine-utils.d.ts" />

/// <reference path="../../../src/ts/automapper.ts" />
/// <reference path="../../../tools/typings/arcady-automapper.d.ts" />

/// <reference path="../../../src/ts/naming-conventions/PascalCaseNamingConvention.ts" />
/// <reference path="../../../src/ts/naming-conventions/CamelCaseNamingConvention.ts" />

class PascalCaseToCamelCaseMappingProfile implements AutoMapperJs.IProfile {
    sourceMemberNamingConvention = new AutoMapperJs.PascalCaseNamingConvention();
    destinationMemberNamingConvention = new AutoMapperJs.CamelCaseNamingConvention();
    profileName = 'PascalCaseToCamelCase';
}

describe('AutoMapper.initialize', () => {
    beforeEach(()=>{
        utils.registerTools(this);
        utils.registerCustomMatchers(this);
    });
	
    it('should be able to use a custom naming convention', () => {
        automapper.initialize((config: AutoMapperJs.IConfiguration) => {
            config.addProfile(new PascalCaseToCamelCaseMappingProfile());
        });

        const sourceKey = 'PascalCase';
        const destinationKey = 'CamelCase';

        const sourceObject = { FullName: 'John Doe' };

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