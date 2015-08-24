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
	
    it('should use created mapping profile', () => {
        // arrange
        var fromKey = '{5700E351-8D88-A327-A216-3CC94A308EDE}';
        var toKey = '{BB33A261-3CA9-A8FC-85E6-2C269F73728C}';

        automapper.initialize((config: AutoMapperJs.IConfiguration) => { 
            config.createMap(fromKey, toKey);
        });

        // act
        automapper.map(fromKey, toKey, {});

        // assert
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
    
    it('should be able to use currying when calling initialize(cfg => cfg.createMap)', () => {
        // arrange
        var fromKey = '{808D9D7F-AA89-4D07-917E-A528F078EE64}';
        var toKey1 = '{B364C0A0-9E24-4424-A569-A4C14102147C}';
        var toKey2 = '{1055CA5A-4FC4-44CA-B4D8-B004F43D4440}';

        var source = { prop: 'Value' };

        // act
        var mapFromKeyCurry: (destinationKey: string) => AutoMapperJs.IAutoMapperCreateMapChainingFunctions;
        
        automapper.initialize((config: AutoMapperJs.IConfiguration) => {
            mapFromKeyCurry = config.createMap(fromKey); // TypeScript does not support function overloads 

            mapFromKeyCurry(toKey1)
                .forSourceMember('prop', (opts: AutoMapperJs.IMemberConfigurationOptions) => { opts.ignore(); });
    
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