var AutoMapperJs;
(function (AutoMapperJs) {
    'use strict';
    /**
     * AutoMapper helper functions
     */
    var AutoMapperHelper = (function () {
        function AutoMapperHelper() {
        }
        AutoMapperHelper.getClassName = function (classType) {
            if (classType && classType.name) {
                return classType.name;
            }
            // source: http://stackoverflow.com/a/13914278/702357
            if (classType && classType.constructor) {
                var className = classType.toString();
                if (className) {
                    // classType.toString() is "function classType (...) { ... }"
                    var matchParts = className.match(/function\s*(\w+)/);
                    if (matchParts && matchParts.length === 2) {
                        return matchParts[1];
                    }
                }
                // for browsers which have name property in the constructor
                // of the object, such as chrome
                if (classType.constructor.name) {
                    return classType.constructor.name;
                }
                if (classType.constructor.toString()) {
                    var str = classType.constructor.toString();
                    if (str.charAt(0) === '[') {
                        // executed if the return of object.constructor.toString() is "[object objectClass]"
                        var arr = str.match(/\[\w+\s*(\w+)\]/);
                    }
                    else {
                        // executed if the return of object.constructor.toString() is "function objectClass () {}"
                        // (IE and Firefox)
                        var arr = str.match(/function\s*(\w+)/);
                    }
                    if (arr && arr.length === 2) {
                        return arr[1];
                    }
                }
            }
            throw new Error("Unable to extract class name from type '" + classType + "'");
        };
        AutoMapperHelper.getFunctionParameters = function (func) {
            var stripComments = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
            var argumentNames = /([^\s,]+)/g;
            var functionString = func.toString().replace(stripComments, '');
            var functionParameterNames = functionString.slice(functionString.indexOf('(') + 1, functionString.indexOf(')')).match(argumentNames);
            if (functionParameterNames === null) {
                functionParameterNames = new Array();
            }
            return functionParameterNames;
        };
        AutoMapperHelper.handleCurrying = function (func, args, closure) {
            var argumentsStillToCome = func.length - args.length;
            // saved accumulator array
            // NOTE BL this does not deep copy array objects, only the array itself; should side effects occur, please report (or refactor).
            var argumentsCopy = Array.prototype.slice.apply(args);
            function accumulator(moreArgs, alreadyProvidedArgs, stillToCome) {
                var previousAlreadyProvidedArgs = alreadyProvidedArgs.slice(0); // to reset
                var previousStillToCome = stillToCome; // to reset
                for (var i = 0; i < moreArgs.length; i++, stillToCome--) {
                    alreadyProvidedArgs[alreadyProvidedArgs.length] = moreArgs[i];
                }
                if (stillToCome - moreArgs.length <= 0) {
                    var functionCallResult = func.apply(closure, alreadyProvidedArgs);
                    // reset vars, so curried function can be applied to new params.
                    alreadyProvidedArgs = previousAlreadyProvidedArgs;
                    stillToCome = previousStillToCome;
                    return functionCallResult;
                }
                else {
                    return function () {
                        // arguments are params, so closure bussiness is avoided.
                        return accumulator(arguments, alreadyProvidedArgs.slice(0), stillToCome);
                    };
                }
            }
            return accumulator([], argumentsCopy, argumentsStillToCome);
        };
        AutoMapperHelper.getMappingMetadataFromConfigFunction = function (destination, func, sourceMapping) {
            if (typeof func !== 'function') {
                return {
                    destination: destination,
                    source: destination,
                    sourceMapping: sourceMapping,
                    condition: null,
                    ignore: false,
                    async: false
                };
            }
            var funcStr = func.toString();
            var parameterNames = AutoMapperHelper.getFunctionParameters(func);
            var optsParamName = parameterNames.length >= 1 ? parameterNames[0] : '';
            var source = sourceMapping
                ? destination
                : AutoMapperHelper.getMapFromString(funcStr, destination, optsParamName);
            var metadata = {
                destination: destination,
                source: source,
                sourceMapping: sourceMapping,
                condition: null,
                ignore: AutoMapperHelper.getIgnoreFromString(funcStr, destination),
                async: parameterNames.length === 2
            };
            // calling the member options function when used asynchronous would be too 'dangerous'.
            if (!metadata.async && AutoMapperHelper.getFunctionCallIndex(funcStr, 'condition', optsParamName) >= 0) {
                metadata.condition = AutoMapperHelper.getConditionFromFunction(func, source);
            }
            return metadata;
        };
        AutoMapperHelper.getIgnoreFromString = function (functionString, optionsParameterName) {
            var indexOfIgnore = AutoMapperHelper.getFunctionCallIndex(functionString, 'ignore', optionsParameterName);
            if (indexOfIgnore < 0) {
                return false;
            }
            var indexOfMapFromStart = functionString.indexOf('(', indexOfIgnore) + 1;
            var indexOfMapFromEnd = functionString.indexOf(')', indexOfMapFromStart);
            if (indexOfMapFromStart < 0 || indexOfMapFromEnd < 0) {
                return false;
            }
            var ignoreString = functionString.substring(indexOfMapFromStart, indexOfMapFromEnd).replace(/\r/g, '').replace(/\n/g, '').trim();
            return ignoreString === null || ignoreString === ''
                ? true // <optionsParameterName>.ignore()
                : false; // <optionsParameterName>.ignore(<ignoreString> -> unexpected content)
        };
        AutoMapperHelper.getMapFromString = function (functionString, defaultValue, optionsParameterName) {
            var indexOfMapFrom = AutoMapperHelper.getFunctionCallIndex(functionString, 'mapFrom', optionsParameterName);
            if (indexOfMapFrom < 0) {
                return defaultValue;
            }
            var indexOfMapFromStart = functionString.indexOf('(', indexOfMapFrom) + 1;
            var indexOfMapFromEnd = functionString.indexOf(')', indexOfMapFromStart);
            if (indexOfMapFromStart < 0 || indexOfMapFromEnd < 0) {
                return defaultValue;
            }
            var mapFromString = functionString.substring(indexOfMapFromStart, indexOfMapFromEnd).replace(/'/g, '').replace(/"/g, '').trim();
            return mapFromString === null || mapFromString === ''
                ? defaultValue
                : mapFromString;
        };
        AutoMapperHelper.getFunctionCallIndex = function (functionString, functionToLookFor, optionsParameterName) {
            var indexOfFunctionCall = functionString.indexOf(optionsParameterName + '.' + functionToLookFor);
            if (indexOfFunctionCall < 0) {
                indexOfFunctionCall = functionString.indexOf('.' + functionToLookFor);
            }
            return indexOfFunctionCall;
        };
        AutoMapperHelper.getConditionFromFunction = function (func, sourceProperty) {
            // Since we are calling the valueOrFunction function to determine whether to ignore or map from another property, we
            // want to prevent the call to be error prone when the end user uses the '(opts)=> opts.sourceObject.sourcePropertyName'
            // syntax. We don't actually have a source object when creating a mapping; therefore, we 'stub' a source object for the
            // function call.
            var sourceObject = {};
            sourceObject[sourceProperty] = {};
            var condition;
            // calling the function will result in calling our stubbed ignore() and mapFrom() functions if used inside the function.
            var configFuncOptions = {
                ignore: function () {
                    // do nothing
                },
                condition: function (predicate) {
                    condition = predicate;
                },
                mapFrom: function (sourcePropertyName) {
                    // do nothing
                },
                sourceObject: sourceObject,
                sourcePropertyName: sourceProperty,
                intermediatePropertyValue: {}
            };
            try {
                func(configFuncOptions);
            }
            catch (exc) {
            }
            return condition;
        };
        return AutoMapperHelper;
    }());
    AutoMapperJs.AutoMapperHelper = AutoMapperHelper;
})(AutoMapperJs || (AutoMapperJs = {}));

//# sourceMappingURL=AutoMapperHelper.js.map
