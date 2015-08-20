/// <reference path="../tools/typings/arcady-automapper.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var AutoMapperJs;
(function (AutoMapperJs) {
    var Samples;
    (function (Samples) {
        var Base = (function () {
            function Base() {
            }
            return Base;
        })();
        Samples.Base = Base;
        var Person = (function (_super) {
            __extends(Person, _super);
            function Person() {
                _super.apply(this, arguments);
            }
            return Person;
        })(Base);
        Samples.Person = Person;
        var ForMemberSamples = (function () {
            function ForMemberSamples() {
            }
            ForMemberSamples.simpleMapFrom = function (log) {
                if (log === void 0) { log = true; }
                var sourceKey = 'simpleMapFrom';
                var destinationKey = '{}';
                var sourceObject = { fullName: 'John Doe' };
                automapper
                    .createMap(sourceKey, destinationKey)
                    .forMember('name', function (opts) { return opts.mapFrom('fullName'); });
                var result = automapper.map(sourceKey, destinationKey, sourceObject);
                if (log) {
                    console.log(result);
                }
                return result;
            };
            ForMemberSamples.stackedForMemberCalls = function (log) {
                if (log === void 0) { log = true; }
                var sourceKey = 'stackedForMemberCalls';
                var destinationKey = 'Person';
                var sourceObject = { birthdayString: '2000-01-01T00:00:00.000Z' };
                automapper
                    .createMap(sourceKey, destinationKey)
                    .forMember('birthday', function (opts) { return opts.mapFrom('birthdayString'); })
                    .forMember('birthday', function (opts) { return new Date(opts.sourceObject[opts.sourcePropertyName]); });
                var result = automapper.map(sourceKey, destinationKey, sourceObject);
                if (log) {
                    console.log(result);
                }
                return result;
            };
            return ForMemberSamples;
        })();
        Samples.ForMemberSamples = ForMemberSamples;
    })(Samples = AutoMapperJs.Samples || (AutoMapperJs.Samples = {}));
})(AutoMapperJs || (AutoMapperJs = {}));
