var utils = {};

utils.registerTools = function () {
    // Object.keys is an EcmaScript 5 feature, add here for browser compatibility.
    if (!Object.keys) {
        Object.keys = function (obj) {
            var keys = [],
                k;
            for (k in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, k)) {
                    keys.push(k);
                }
            }
            return keys;
        };
    }
};

/**
 * registers custom Jasmine Matcher functions
 */
utils.registerCustomMatchers = function () {
    function equalsData(actual, expected) {
        var toClass = {}.toString;

        // check array.
        var actualType = toClass.call(actual);
        var expectedType = toClass.call(expected);

        if (actualType === '[object Array]') {
            // check both are arrays
            if (expectedType !== '[object Array]') {
                return false;
            }

            // check both have same length
            if (expected.length !== actual.length) {
                return false;
            }

            for (var i = 0; i < actual.length; i++) {
                // check each item in the array
                if (!equalsData(actual[i], expected[i]))
                    return false;
            }
        }
        else if (actualType === '[object Object]') {
            // check both are objects
            if (expectedType !== '[object Object]') {
                return false;
            }

            // check each property in the object
            for (var propertyName in expected) {
                if (!expected.hasOwnProperty(propertyName)) {
                    continue;
                }

                if (!actual.hasOwnProperty(propertyName)) {
                    return false;
                }

                if (!equalsData(actual[propertyName], expected[propertyName]))
                    return false;
            }
        } else {
            var actualIsUndefined = typeof actual === 'undefined';
            var expectedIsUndefined = typeof expected === 'undefined';
            if (actualIsUndefined !== expectedIsUndefined) {
                return false;
            }

            return actual === expected;
        }

        return true;
    }
    
    jasmine.addMatchers({
        /**
         * toEqualData compares to data objects using angular.equals
         */
        toEqualData: function () {
            return {
                compare: function (actual, expected) {
                    var result = {};
                    result.pass = equalsData(actual, expected);
                    result.message = result.pass
                        ? 'Data sets do equal. Congratulations ;) !'
                        : 'Data sets do not equal: expected "' + JSON.stringify(expected) + '", actual "' + JSON.stringify(actual) + '".';
                    return result;
                }
            };
        },
        fail: function () {
            return {
                compare: function (actual, message) {
                    return {
                        pass: false,
                        message: message || 'Jasmine test failed. Please provide a fix.'
                    };
                }
            }
        }
    });
};

var spyStrategy = function (spy) {
    return {
        und: {
            callThrough: function () {
                spy.and.callThrough();
                return spy;
            },
            returnValue: function (value) {
                spy.and.returnValue(value);
                return spy;
            }
        }
    };
}

utils.spyOn = function (object, fnName) {
    var spy = spyOn(object, fnName);

    return spyStrategy(spy);
}

utils.createSpy = function (fnName) {
    var spy = jasmine.createSpy(fnName);

    return spyStrategy(spy);
}

/**
 *notifyCallback can be used to be notified when the promise has occurred.
 * @param existingPromise Add the function to an existing object
 * @param {boolean} spy if a jasmine spy should be created or not.
**/
utils.createPromiseMock = function (methodName, returnMock, notifyCallback, existingPromise, spy) {
    var object = existingPromise || {};

    var method = function () {
        return {
            then: function (callBack) {
                callBack(returnMock);

                if (notifyCallback) {
                    notifyCallback();
                }
            }
        }
    };

    if (spy === true) {
        object[methodName] = jasmine.createSpy(methodName).and.callFake(method);
    } else {
        object[methodName] = method;
    }

    return object;
}