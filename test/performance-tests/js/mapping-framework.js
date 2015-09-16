/// <reference path="simple-mapping-performance.ts" />
/// <reference path="simple-mapping-performance-currying.ts" />
/// <reference path="../../../dist/arcady-automapper.d.ts" />
var AutoMapperJS;
(function (AutoMapperJS) {
    'use strict';
    var MappingPerformanceTestFrame = (function () {
        function MappingPerformanceTestFrame() {
        }
        MappingPerformanceTestFrame.prototype.execute = function (repetitions) {
            if (repetitions === void 0) { repetitions = 1 * 1000 * 1000; }
            var results = new Array();
            Array.prototype.push.apply(results, new AutoMapperJS.SimpleMappingPerformance().execute(repetitions));
            Array.prototype.push.apply(results, new AutoMapperJS.SimpleMappingPerformanceWithCurrying().execute(repetitions));
            return results;
        };
        return MappingPerformanceTestFrame;
    })();
    AutoMapperJS.MappingPerformanceTestFrame = MappingPerformanceTestFrame;
})(AutoMapperJS || (AutoMapperJS = {}));

//# sourceMappingURL=mapping-framework.js.map