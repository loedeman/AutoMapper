var eventStream = require('event-stream'),
    path = require('path'),
    gutil = require('gulp-util'),
    PluginError = gutil.PluginError,
    KarmaServer = require('karma').Server;

// Consts
var PLUGIN_NAME = 'gulp-karma';

// Plugin level function (dealing with files)
function gulpKarma(options) {
    if (options.configFile) {
        options.configFile = path.resolve(options.configFile);
    }
    var files = [];
    
    function queueFile(file) {
        // Push gulp.src(...) files to files array.
        files.push(file.path);
    }
    
    function endStream() {
        options.files = files;
        
        var server = new KarmaServer(options);
        server.start(function(exitCode) {
            if (exitCode) {
                stream.emit('error', new gutil.PluginError('gulp-karma', 'karma exited with code ' + exitCode));
            } else {       
                stream.emit('end');
            }
        });
    }
    
    var stream = eventStream.through(queueFile, endStream);
    return stream;
}

// Exporting the plugin main function
module.exports = gulpKarma;