/// <reference path="../../tools/typings/arcady-automapper.d.ts" />
var AutoMapperJs;
(function (AutoMapperJs) {
    'use strict';
    var TypeConverter = (function () {
        function TypeConverter() {
        }
        TypeConverter.prototype.convert = function (resolutionContext) {
            // NOTE BL Unfortunately, TypeScript/JavaScript do not support abstract base classes.
            //         This is just one way around, please convince me about a better solution.
            throw new Error('The TypeConverter.convert method is abstract. Use a TypeConverter extension class instead.');
        };
        return TypeConverter;
    })();
    AutoMapperJs.TypeConverter = TypeConverter;
})(AutoMapperJs || (AutoMapperJs = {}));

//# sourceMappingURL=TypeConverter.js.map