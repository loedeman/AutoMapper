/// <reference path="../../../tools/typings/jasmine/jasmine.d.ts" />
/// <reference path="../../typings/jasmine-utils.d.ts" />
/// <reference path="../../../dist/automapper-classes.d.ts" />
/// <reference path="../../../dist/automapper-interfaces.d.ts" />
/// <reference path="../../../dist/automapper-declaration.d.ts" />
var globalScope = this;
var AutoMapperJs;
(function (AutoMapperJs) {
    'use strict';
    describe('AutoMapperHelper', function () {
        var postfix = ' [f0e5ef36-e1ed-47c4-a86f-48f8b52e6897]';
        beforeEach(function () {
            utils.registerTools(globalScope);
            utils.registerCustomMatchers(globalScope);
        });
        it('should be able to use forMember to ignore a property', function () {
            // arrange
            var functionString = '';
            // act
            var parameters = AutoMapperJs.AutoMapperHelper.getFunctionParameters(functionString);
            // assert
        });
    });
})(AutoMapperJs || (AutoMapperJs = {}));
