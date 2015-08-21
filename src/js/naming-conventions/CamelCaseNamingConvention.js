/// <reference path="../../../tools/typings/arcady-automapper.d.ts" />
var AutoMapperJs;
(function (AutoMapperJs) {
    'use strict';
    var CamelCaseNamingConvention = (function () {
        function CamelCaseNamingConvention() {
            this.splittingExpression = /^[a-z]+(?=$|[A-Z]{1}[a-z0-9]+)|[A-Z]?[a-z0-9]+/;
            this.separatorCharacter = '';
        }
        return CamelCaseNamingConvention;
    })();
    AutoMapperJs.CamelCaseNamingConvention = CamelCaseNamingConvention;
})(AutoMapperJs || (AutoMapperJs = {}));

//# sourceMappingURL=../naming-conventions/CamelCaseNamingConvention.js.map