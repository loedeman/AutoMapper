/// <reference path="AutoMapperEnumerations.ts" />

module AutoMapperJs {
    'use strict';

    /**
     * AutoMapper helper functions
     */
    export class AutoMapperHelper {
        public static getClassName(classType: new () => any): string {
            if (classType && (<any>classType).name) {
                return (<any>classType).name;
            }
            // source: http://stackoverflow.com/a/13914278/702357
            if (classType && classType.constructor) {
                let className = classType.toString();
                if (className) {
                    // classType.toString() is "function classType (...) { ... }"
                    let matchParts = className.match(/function\s*(\w+)/);
                    if (matchParts && matchParts.length === 2) {
                        return matchParts[1];
                    }
                }

                // for browsers which have name property in the constructor
                // of the object, such as chrome
                if ((<any>classType.constructor).name) {
                    return (<any>classType.constructor).name;
                }

                if (classType.constructor.toString()) {
                    let str = classType.constructor.toString();

                    let regExpMatchArray: RegExpMatchArray;
                    if (str.charAt(0) === '[') {
                        // executed if the return of object.constructor.toString() is "[object objectClass]"
                        regExpMatchArray = str.match(/\[\w+\s*(\w+)\]/);
                    } else {
                        // executed if the return of object.constructor.toString() is "function objectClass () {}"
                        // (IE and Firefox)
                        regExpMatchArray = str.match(/function\s*(\w+)/);
                    }

                    if (regExpMatchArray && regExpMatchArray.length === 2) {
                        return regExpMatchArray[1];
                    }
                }
            }

            throw new Error(`Unable to extract class name from type '${classType}'`);
        }

        public static getFunctionParameters(functionStr: string): Array<string> {
            const stripComments = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
            const argumentNames = /([^\s,]+)/g;

            var functionString = functionStr.replace(stripComments, '');

            var functionParameterNames = functionString.slice(functionString.indexOf('(') + 1, functionString.indexOf(')')).match(argumentNames);
            if (functionParameterNames === null) {
                functionParameterNames = new Array<string>();
            }
            return functionParameterNames;
        }

        public static handleCurrying(func: Function, args: IArguments, closure: any): any {
            const argumentsStillToCome = func.length - args.length;

            // saved accumulator array
            // NOTE BL this does not deep copy array objects, only the array itself; should side effects occur, please report (or refactor).
            var argumentsCopy = Array.prototype.slice.apply(args);

            function accumulator(moreArgs: IArguments, alreadyProvidedArgs: Array<any>, stillToCome: number): Function {
                var previousAlreadyProvidedArgs = alreadyProvidedArgs.slice(0); // to reset
                var previousStillToCome = stillToCome; // to reset

                for (let i = 0; i < moreArgs.length; i++ , stillToCome--) {
                    alreadyProvidedArgs[alreadyProvidedArgs.length] = moreArgs[i];
                }

                if (stillToCome - moreArgs.length <= 0) {
                    var functionCallResult = func.apply(closure, alreadyProvidedArgs);

                    // reset vars, so curried function can be applied to new params.
                    alreadyProvidedArgs = previousAlreadyProvidedArgs;
                    stillToCome = previousStillToCome;

                    return functionCallResult;
                } else {
                    return function (): Function {
                        // arguments are params, so closure bussiness is avoided.
                        return accumulator(arguments, alreadyProvidedArgs.slice(0), stillToCome);
                    };
                }
            }

            return accumulator(<IArguments>(<any>[]), argumentsCopy, argumentsStillToCome);
        }

        public static getMappingMetadataFromTransformationFunction(destination: string, func: any, sourceMapping: boolean): IMemberMappingMetaData {
            if (typeof func !== 'function') {
                return {
                    destination: destination,
                    source: destination,
                    transformation: AutoMapperHelper.getDestinationTransformation(func, false, sourceMapping, false),
                    sourceMapping: sourceMapping,
                    condition: null,
                    ignore: false,
                    async: false
                };
            }
            var functionStr = func.toString();
            var parameterNames = AutoMapperHelper.getFunctionParameters(functionStr);

            var optsParamName = parameterNames.length >= 1 ? parameterNames[0] : '';

            var source = sourceMapping
                ? destination
                : AutoMapperHelper.getMapFromString(functionStr, destination, optsParamName);

            var metadata: IMemberMappingMetaData = {
                destination: destination,
                source: source,
                transformation: AutoMapperHelper.getDestinationTransformation(func, true, sourceMapping, parameterNames.length === 2),
                sourceMapping: sourceMapping,
                condition: null,
                ignore: AutoMapperHelper.getIgnoreFromString(functionStr, destination),
                async: parameterNames.length === 2
            };

            // calling the member options function when used asynchronous would be too 'dangerous'.
            if (!metadata.async && AutoMapperHelper.getFunctionCallIndex(functionStr, 'condition', optsParamName) >= 0) {
                metadata.condition = AutoMapperHelper.getConditionFromFunction(func, source);
            }

            return metadata;
        }

        private static getDestinationTransformation(func: any, isFunction: boolean, sourceMapping: boolean, async: boolean): IDestinationTransformation {
            if (!isFunction) {
                return {
                    transformationType: DestinationTransformationType.Constant,
                    constant: func
                };
            }

            var transformation: IDestinationTransformation;
            if (sourceMapping) {
                if (async) {
                    transformation = {
                        transformationType: DestinationTransformationType.AsyncSourceMemberOptions,
                        asyncSourceMemberConfigurationOptionsFunc: func
                    };
                } else {
                    transformation = {
                        transformationType: DestinationTransformationType.SourceMemberOptions,
                        sourceMemberConfigurationOptionsFunc: func
                    };
                }
            } else {
                if (async) {
                    transformation = {
                        transformationType: DestinationTransformationType.AsyncMemberOptions,
                        asyncMemberConfigurationOptionsFunc: func
                    };
                } else {
                    transformation = {
                        transformationType: DestinationTransformationType.MemberOptions,
                        memberConfigurationOptionsFunc: func
                    };
                }
            }
            return transformation;
        }

        private static getIgnoreFromString(functionString: string, optionsParameterName: string): boolean {
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
        }

        private static getMapFromString(functionString: string, defaultValue: string, optionsParameterName: string): string {
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
        }

        private static getFunctionCallIndex(functionString: string, functionToLookFor: string, optionsParameterName: string): number {
            var indexOfFunctionCall = functionString.indexOf(optionsParameterName + '.' + functionToLookFor);
            if (indexOfFunctionCall < 0) {
                indexOfFunctionCall = functionString.indexOf('.' + functionToLookFor);
            }

            return indexOfFunctionCall;
        }

        private static getConditionFromFunction(func: Function, sourceProperty: string): ((sourceObject: any) => boolean) {
            // Since we are calling the valueOrFunction function to determine whether to ignore or map from another property, we
            // want to prevent the call to be error prone when the end user uses the '(opts)=> opts.sourceObject.sourcePropertyName'
            // syntax. We don't actually have a source object when creating a mapping; therefore, we 'stub' a source object for the
            // function call.
            var sourceObject: any = {};
            sourceObject[sourceProperty] = {};

            var condition: (sourceObject: any) => boolean;

            // calling the function will result in calling our stubbed ignore() and mapFrom() functions if used inside the function.
            const configFuncOptions: IMemberConfigurationOptions = {
                ignore: (): void => {
                    // do nothing
                },
                condition: (predicate: ((sourceObject: any) => boolean)): void => {
                    condition = predicate;
                },
                mapFrom: (sourcePropertyName: string): void => {
                    // do nothing
                },
                sourceObject: sourceObject,
                sourcePropertyName: sourceProperty,
                intermediatePropertyValue: {}
            };

            try {
                func(configFuncOptions);
            } catch (exc) {
                // do not handle by default.
            }

            return condition;
        }
    }
}