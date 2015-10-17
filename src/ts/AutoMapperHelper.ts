module AutoMapperJs {
    'use strict';

    /**
     * AutoMapper helper functions
     */
    export class AutoMapperHelper {
        public static getClassName(classType: new() => any): string {
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
                    var str = classType.constructor.toString();

                    if (str.charAt(0) === '[') {
                        // executed if the return of object.constructor.toString() is "[object objectClass]"
                        var arr = str.match(/\[\w+\s*(\w+)\]/);
                    } else {
                        // executed if the return of object.constructor.toString() is "function objectClass () {}"
                        // (IE and Firefox)
                        var arr = str.match(/function\s*(\w+)/);
                    }

                    if (arr && arr.length === 2) {
                        return arr[1];
                    }
                }
            }

            throw new Error(`Unable to extract class name from type '${classType}'`);
        }

        public static getFunctionParameters(func: Function): Array<string> {
            const stripComments = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
            const argumentNames = /([^\s,]+)/g;

            var functionString = func.toString().replace(stripComments, '');
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

                for (let i = 0; i < moreArgs.length; i++, stillToCome--) {
                    alreadyProvidedArgs[alreadyProvidedArgs.length] = moreArgs[i];
                }

                if (stillToCome - moreArgs.length <= 0) {
                    var functionCallResult = func.apply(closure, alreadyProvidedArgs);

                    // reset vars, so curried function can be applied to new params.
                    alreadyProvidedArgs = previousAlreadyProvidedArgs;
                    stillToCome = previousStillToCome;

                    return functionCallResult;
                } else {
                    return function(): Function {
                        // arguments are params, so closure bussiness is avoided.
                        return accumulator(arguments, alreadyProvidedArgs.slice(0), stillToCome);
                    };
                }
            }

            return accumulator(<IArguments>(<any>[]), argumentsCopy, argumentsStillToCome);
        }
	}
}