/// <reference path="../../../tools/typings/jasmine/jasmine.d.ts" />
/// <reference path="../../typings/jasmine-utils.d.ts" />

/// <reference path="../../../dist/arcady-automapper-classes.d.ts" />
/// <reference path="../../../dist/arcady-automapper-interfaces.d.ts" />
/// <reference path="../../../dist/arcady-automapper-declaration.d.ts" />

var globalScope = this;

module AutoMapperJs {
    describe('AutoMapper (asynchronous mapping)', () => {
        beforeEach(() => {
            utils.registerTools(globalScope);
            utils.registerCustomMatchers(globalScope);
        });

        it('should be able to map asynchronous using forMember', (done) => {
            // arrange
            var objFrom = { prop: 'prop' };

            var fromKey = 'async-forMember-';
            var toKey = 'valid-1';

            // act
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop', (opts: IMemberConfigurationOptions, cb: IMemberCallback) => {
                    // do something asynchronous
                    setTimeout(function(){ 
                        cb(opts.destinationPropertyValue + ' (async)');
                    }, 100);
                })
                .forMember('prop', (opts: IMemberConfigurationOptions) => {
                    return opts.destinationPropertyValue + ' (sync)';
                });
            
            automapper.mapAsync(fromKey, toKey, objFrom, (result: any) => {
                // assert
                expect(result.prop).toEqual(objFrom.prop + ' (async)' + ' (sync)');
                done();
            });
        });

        it('should be able to map asynchronous using forSourceMember', () => {
            var objFrom = { prop: 'prop' };

            var fromKey = 'async-forMember-';
            var toKey = 'valid-1';

            automapper
                .createMap(fromKey, toKey)
                .forSourceMember('prop', (opts: ISourceMemberConfigurationOptions, cb: IMemberCallback) => {
                    // do something asynchronous
                    setTimeout(function(){ 
                        cb('AsyncValue');
                    }, 100);
                });
            
        });
    });
}