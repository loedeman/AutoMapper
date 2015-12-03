/// <reference path="mapping-framework.ts" />
/// <reference path="../../../dist/automapper.d.ts" />
var AutoMapperJS;
(function (AutoMapperJS) {
    'use strict';
    var SimpleMappingPerformanceWithCurrying = (function () {
        function SimpleMappingPerformanceWithCurrying() {
        }
        SimpleMappingPerformanceWithCurrying.prototype.execute = function (repetitions) {
            if (repetitions === void 0) { repetitions = 1 * 1000 * 1000; }
            var result = new Array();
            var executeRepeatFunc = function (action) {
                for (var repetition = 0; repetition < repetitions; repetition++) {
                    action();
                }
            };
            result.push(this.executeMappingDefaults(executeRepeatFunc, repetitions));
            result.push(this.executeSimpleMapping(executeRepeatFunc, repetitions));
            result.push(this.executeOverruleMapping(executeRepeatFunc, repetitions));
            result.push(this.executeMapFromMapping(executeRepeatFunc, repetitions));
            return result;
        };
        SimpleMappingPerformanceWithCurrying.prototype.executeMappingDefaults = function (executeRepeatFunc, repetitions) {
            var fromObj = {
                prop1: 'Value1',
                prop2: 'Value2'
            };
            var t0 = performance.now();
            var from = '31a59aa6-daa6-4b5e-968e-8b724743d0e7';
            var to = '0a89f8f5-0999-4b39-9f52-5d1f35a1ca03';
            automapper
                .createMap(from, to);
            var t1 = performance.now();
            var mapFunc = automapper.map(from, to);
            executeRepeatFunc(function () {
                mapFunc(fromObj);
            });
            var t2 = performance.now();
            // old school hard coded comparable functionality
            var oldSchoolT1 = performance.now();
            executeRepeatFunc(function () {
                var toObj = {};
                toObj.prop1 = fromObj.prop1;
                toObj.prop1 = fromObj.prop2;
            });
            var oldSchoolT2 = performance.now();
            return {
                class: 'SimpleMappingPerformanceWithCurrying',
                test: 'executeMappingDefaults',
                repetitions: repetitions,
                creationTimeInMs: t1 - t0,
                executionTimeInMs: t2 - t1,
                referenceExecutionTimeInMs: oldSchoolT2 - oldSchoolT1
            };
        };
        SimpleMappingPerformanceWithCurrying.prototype.executeSimpleMapping = function (executeRepeatFunc, repetitions) {
            var fromObj = {
                prop1: 'Value1',
                prop2: 'Value2'
            };
            var t0 = performance.now();
            var from = '31a59aa6-daa6-4b5e-968e-7c724943d0b8';
            var to = '0b89f8f5-0989-4b39-9e15-51ef35a1ca03';
            automapper
                .createMap(from, to)
                .forMember('prop1', function (opts) { return opts.sourceObject[opts.sourcePropertyName]; })
                .forMember('prop2', function (opts) { return opts.sourceObject[opts.sourcePropertyName]; });
            var t1 = performance.now();
            var mapFunc = automapper.map(from, to);
            executeRepeatFunc(function () {
                mapFunc(fromObj);
            });
            var t2 = performance.now();
            // old school hard coded comparable functionality
            var oldSchoolT1 = performance.now();
            executeRepeatFunc(function () {
                var toObj = {};
                toObj.prop1 = fromObj.prop1;
                toObj.prop2 = fromObj.prop2;
            });
            var oldSchoolT2 = performance.now();
            return {
                class: 'SimpleMappingPerformanceWithCurrying',
                test: 'executeSimpleMapping',
                repetitions: repetitions,
                creationTimeInMs: t1 - t0,
                executionTimeInMs: t2 - t1,
                referenceExecutionTimeInMs: oldSchoolT2 - oldSchoolT1
            };
        };
        SimpleMappingPerformanceWithCurrying.prototype.executeOverruleMapping = function (executeRepeatFunc, repetitions) {
            var fromObj = { prop1: 'From A', prop2: 'From A too' };
            var fromKey = '{7AC4134B-ECC1-464B-B144-5B9D8F5B568E}';
            var toKey = '{2BDE907C-1CE6-4CC5-A601-9A94CC665837}';
            var t0 = performance.now();
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop1', function (opts) { opts.mapFrom('prop2'); })
                .forMember('prop1', function (opts) { opts.ignore(); });
            var t1 = performance.now();
            var mapFunc = automapper.map(fromKey, toKey);
            executeRepeatFunc(function () {
                mapFunc(fromObj);
            });
            var t2 = performance.now();
            // old school hard coded comparable functionality
            var oldSchoolT1 = performance.now();
            executeRepeatFunc(function () {
                var toObj = {};
            });
            var oldSchoolT2 = performance.now();
            return {
                class: 'SimpleMappingPerformanceWithCurrying',
                test: 'executeOverruleMapping',
                repetitions: repetitions,
                creationTimeInMs: t1 - t0,
                executionTimeInMs: t2 - t1,
                referenceExecutionTimeInMs: oldSchoolT2 - oldSchoolT1
            };
        };
        SimpleMappingPerformanceWithCurrying.prototype.executeMapFromMapping = function (executeRepeatFunc, repetitions) {
            var fromObj = { prop1: 'From A', prop2: 'From A too' };
            var fromKey = '{7AC4134B-ECC1-464B-B144-5B9D8F5B568E}';
            var toKey = '{2BDE907C-1CE6-4CC5-A601-9A94CC665837}';
            var t0 = performance.now();
            automapper
                .createMap(fromKey, toKey)
                .forMember('prop1', function (opts) { opts.mapFrom('prop2'); });
            var t1 = performance.now();
            var mapFunc = automapper.map(fromKey, toKey);
            executeRepeatFunc(function () {
                mapFunc(fromObj);
            });
            var t2 = performance.now();
            // old school hard coded comparable functionality
            var oldSchoolT1 = performance.now();
            executeRepeatFunc(function () {
                var toObj = {};
                toObj.prop1 = fromObj.prop2;
            });
            var oldSchoolT2 = performance.now();
            return {
                class: 'SimpleMappingPerformanceWithCurrying',
                test: 'executeOverruleMapping',
                repetitions: repetitions,
                creationTimeInMs: t1 - t0,
                executionTimeInMs: t2 - t1,
                referenceExecutionTimeInMs: oldSchoolT2 - oldSchoolT1
            };
        };
        return SimpleMappingPerformanceWithCurrying;
    })();
    AutoMapperJS.SimpleMappingPerformanceWithCurrying = SimpleMappingPerformanceWithCurrying;
})(AutoMapperJS || (AutoMapperJS = {}));

//# sourceMappingURL=simple-mapping-performance-currying.js.map