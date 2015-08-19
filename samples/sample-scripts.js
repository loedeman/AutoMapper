function printInSampleTemplate(code, result) {
    return '<table style="width:100%;"><tr><th>Code</th><th>Result</th></tr><tr><td style="width: 50%;vertical-align:top;"><pre class="typescript">' +
        code +
        '</pre></td><td style="width: 50%;vertical-align:top;"><pre class="json">' +
        result +
        '</pre></td></tr></table>';
}

function execAndPrint(code, func, id) {
    // var code = document.getElementById("forMemberMapFrom").innerHTML = func.toString(); // JS code
    var result = print(func());

    document.getElementById(id).innerHTML = printInSampleTemplate(code, result);
}

function print(obj, indentLevel, indentConst, newLineConst) {
    var toClass = {}.toString;

    if (indentLevel == null || typeof indentLevel === 'undefined')
        indentLevel = 0;

    if (!indentConst) indentConst = ' ';
    if (!newLineConst) newLineConst = '\n';

    var indentSpaces = '';
    for (var level = indentLevel; level > 0; level--)
        indentSpaces += indentConst + indentConst;

    var output = '';

    if (Object.prototype.toString.call(obj) === '[object Array]') {
        output += newLineConst;
        output += indentSpaces + '[ ';// + newLineConst;
        for (var index in obj) {
            //output += '  ' + indentSpaces + i + ' : ' + newLineConst;
            var arrayItemString = print(obj[index], indentLevel + 1);
            arrayItemString = arrayItemString.substring(0, arrayItemString.length - 1).trim();
            output += arrayItemString;
            output += index < obj.length - 1
                ? ', '
                : newLineConst;// + newLineConst;
        }
        output += indentSpaces + ']' + newLineConst;
    } else if (typeof obj == 'object') {
        switch (toClass.call(obj)) {
            case '[object Object]':
                {
                    var objString = '{' + newLineConst;
                    for (var property in obj) {
                        objString += '  ' + indentSpaces + '"' + property + '"' + ' : ' + print(obj[property], indentLevel + 1) + ',' + newLineConst;
                    }
                    if (objString.length > 2)
                        objString = objString.substring(0, objString.length - 2) + newLineConst;
                    objString += indentSpaces + '}' + newLineConst;

                    output += objString;
                }
                break;
            case '[object String]':
                output += '"' + obj + '"';
                break;
            case '[object Number]':
                output += obj;
                break;
            case '[object Date]':
                output += '"' + obj.toISOString() + '"';
                break;
            default:
                {
                    if (typeof obj === 'undefined' || obj === null)
                        output += 'null';
                    else
                        output += obj;
                }
                break;
        }
    } else {
        switch (toClass.call(obj)) {
            case '[object String]':
                output += '"' + obj + '"';
                break;
            case '[object Number]':
                output += obj;
                break;
            case '[object Date]':
                output += '"' + obj.toISOString() + '"';
                break;
            default:
                if (typeof obj === 'undefined' || obj === null)
                    output += 'null';
                else
                    output += obj;
                break;
        }
    }

    return output;
}
