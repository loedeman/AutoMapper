/// <reference path="../../../tools/typings/jasmine/jasmine.d.ts" />
/// <reference path="../../typings/jasmine-utils.d.ts" />

/// <reference path="../../../dist/arcady-automapper-classes.d.ts" />
/// <reference path="../../../dist/arcady-automapper-interfaces.d.ts" />
/// <reference path="../../../dist/arcady-automapper-declaration.d.ts" />

var globalScope = this;

module AutoMapperJs {
    describe('AutoMapper - Currying support', () => {
        beforeEach(() => {
            utils.registerTools(globalScope);
            utils.registerCustomMatchers(globalScope);
        });

        it('should be able to use currying when calling createMap', () => {
            // arrange
            var fromKey = '{808D9D7F-AA89-4D07-917E-A528F055EE64}';
            var toKey1 = '{B364C0A0-9E24-4424-A569-A4C14101947C}';
            var toKey2 = '{1055CA5A-4FC4-44CB-B4D8-B004F43D8840}';

            var source = { prop: 'Value' };

            // act
            var mapFromKeyCurry = automapper.createMap(fromKey);

            mapFromKeyCurry(toKey1)
                .forSourceMember('prop', (opts: IMemberConfigurationOptions) => { opts.ignore(); });

            mapFromKeyCurry(toKey2);

            var result1 = automapper.map(fromKey, toKey1, source);
            var result2 = automapper.map(fromKey, toKey2, source);

            // assert
            expect(typeof mapFromKeyCurry === 'function').toBeTruthy();
            expect(result1.prop).toBeUndefined();
            expect(result2.prop).toEqual(source.prop);
        });

        it('should be able to use currying when calling map', () => {
            // arrange
            var fromKey = '{FC18523B-5A7C-4193-B938-B6AA2EABB37A}';
            var toKey1 = '{609202F4-15F7-4512-9178-CFAF073800E1}';
            var toKey2 = '{85096AE2-92FB-43D7-8FC3-EC14DDC1DFDD}';

            var source = { prop: 'Value' };

            // act
            var createMapFromKeyCurry = automapper.createMap(fromKey);

            createMapFromKeyCurry(toKey1)
                .forSourceMember('prop', (opts: ISourceMemberConfigurationOptions) => { opts.ignore(); });

            createMapFromKeyCurry(toKey2);

            var result1MapCurry = automapper.map(fromKey, toKey1);
            var result2MapCurry = automapper.map(fromKey, toKey2);

            var result1 = result1MapCurry(source);
            var result2 = result2MapCurry(source);

            // assert
            expect(typeof createMapFromKeyCurry === 'function').toBeTruthy();
            expect(typeof result1MapCurry === 'function').toBeTruthy();
            expect(typeof result2MapCurry === 'function').toBeTruthy();

            expect(result1.prop).toBeUndefined();
            expect(result2.prop).toEqual(source.prop);
        });
    });
}