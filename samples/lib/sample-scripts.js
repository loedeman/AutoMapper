function printInSampleTemplate(code, result) {
    return '<table style="width:100%;"><tr><th>Code</th><th>Result</th></tr><tr><td style="width: 50%;vertical-align:top;"><pre class="typescript">' +
        code +
        '</pre></td><td style="width: 50%;vertical-align:top;"><pre class="json">' +
        result +
        '</pre></td></tr></table>';
}

function execAndPrint(code, func, id) {
    // var code = document.getElementById("forMemberMapFrom").innerHTML = func.toString(); // JS code
    var result;
    try {
        result = JSON.stringify(func(), null, '\t');
    } catch (error) {
        console.error(error);
        result = 'Function execution failed with the following error message: ' + error.message;    
    }

    document.getElementById(id).innerHTML = printInSampleTemplate(code, result);
}