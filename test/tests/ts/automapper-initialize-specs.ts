/// <reference path="../../../tools/typings/jasmine/jasmine.d.ts" />
/// <reference path="../../typings/jasmine-utils.d.ts" />

/// <reference path="../../../dist/arcady-automapper-classes.d.ts" />
/// <reference path="../../../dist/arcady-automapper-interfaces.d.ts" />
/// <reference path="../../../dist/arcady-automapper-declaration.d.ts" />

class PascalCaseToCamelCaseMappingProfile implements AutoMapperJs.IProfile {
    sourceMemberNamingConvention = new AutoMapperJs.PascalCaseNamingConvention();
    destinationMemberNamingConvention = new AutoMapperJs.CamelCaseNamingConvention();
    profileName = 'PascalCaseToCamelCase';
}

class CamelCaseToPascalCaseMappingProfile implements AutoMapperJs.IProfile {
    sourceMemberNamingConvention = new AutoMapperJs.CamelCaseNamingConvention();
    destinationMemberNamingConvention = new AutoMapperJs.PascalCaseNamingConvention();
    profileName = 'CamelCaseToPascalCase';
}

describe('AutoMapper.initialize', () => {
    beforeEach(()=>{
        utils.registerTools(this);
        utils.registerCustomMatchers(this);
    });
	
    it('should be able to use a naming convention to convert Pascal case to camel case', () => {
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

    it('should be able to use a naming convention to convert camelCase to PascalCase', () => {
        automapper.initialize((config: AutoMapperJs.IConfiguration) => {
            config.addProfile(new CamelCaseToPascalCaseMappingProfile());
        });

        const sourceKey = 'CamelCase2';
        const destinationKey = 'PascalCase2';

        const sourceObject = { fullName: 'John Doe' };

        automapper
            .createMap(sourceKey, destinationKey)
            .withProfile('CamelCaseToPascalCase');

        var result = automapper.map(sourceKey, destinationKey, sourceObject);

        expect(result).toEqualData({ FullName: 'John Doe' });
    });
    
    it('should be able to use forMember besides using a profile', () => {
        automapper.initialize((config: AutoMapperJs.IConfiguration) => {
            config.addProfile(new CamelCaseToPascalCaseMappingProfile());
        });

        const sourceKey = 'CamelCase';
        const destinationKey = 'PascalCase';

        const sourceObject = { fullName: 'John Doe', age: 20 };

        automapper
            .createMap(sourceKey, destinationKey)
            .withProfile('CamelCaseToPascalCase')
            .forMember('theAge', (opts: AutoMapperJs.IMemberConfigurationOptions) =>opts.mapFrom('age'));

        var result = automapper.map(sourceKey, destinationKey, sourceObject);

        expect(result).toEqualData({ FullName: 'John Doe', theAge: sourceObject.age });
    });
});