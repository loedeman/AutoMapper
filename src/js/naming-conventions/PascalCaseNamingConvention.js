/// <reference path="../../../tools/typings/arcady-automapper.d.ts" />
var AutoMapperJs;
(function (AutoMapperJs) {
    'use strict';
    var PascalCaseNamingConvention = (function () {
        function PascalCaseNamingConvention() {
            this.splittingExpression = /[A-Z]+(?=$|[A-Z]{1}[a-z0-9]+)|[A-Z]?[a-z0-9]+/;
            this.separatorCharacter = '';
        }
        return PascalCaseNamingConvention;
    })();
    AutoMapperJs.PascalCaseNamingConvention = PascalCaseNamingConvention;
})(AutoMapperJs || (AutoMapperJs = {}));

//# sourceMappingURL=../naming-conventions/PascalCaseNamingConvention.js.map