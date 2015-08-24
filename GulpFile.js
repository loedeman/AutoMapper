'use strict';

var gulp = require('gulp'),
    debug = require('gulp-debug'),
    inject = require('gulp-inject'),
    tsc = require('gulp-typescript'),
    tslint = require('gulp-tslint'),
    sourcemaps = require('gulp-sourcemaps'),
    del = require('del'),
    Config = require('./gulp.config.js'),
    gulpKarma = require('gulp-karma'),
    KarmaServer = require('karma').Server,
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    
    eventStream = require('event-stream'),
    path = require('path'),
    through = require('through2'),
    gutil = require('gulp-util'),
    PluginError = gutil.PluginError;
    
var config = new Config();
var typeScriptCompilerOptions = { noImplicitAny: true };

gulp.task('watch', function() {
    gulp.watch([config.allTypeScript], 
               [
                   'compile-app', 
                   'compile-test-app-dependent',
                   'bundle-app', 
                   'bundle-app-uglify', 
                   'bundle-app-definitions'
               ]);
});


gulp.task('default', ['compile-app',
                      'compile-test-app-dependent', 
                      'bundle-app', 
                      'bundle-app-uglify',
                      'bundle-app-definitions', 
                      'test'], function () { });


/**
 * Lint all custom TypeScript files.
 */
gulp.task('ts-lint', function () {
    var tsFiles = [
        config.allAppTsFiles,
        config.allSampleTsFiles
        ];
    return gulp.src(tsFiles).pipe(tslint()).pipe(tslint.report('prose'));
});


/**
 * Compile TypeScript and include references to library and app .d.ts files.
 */
gulp.task('compile-app', ['ts-lint'], function () {
    var appTsFiles = [config.allAppTsFiles,                 // path to typescript files
                      config.libraryTypeScriptDefinitions]; // reference to library .d.ts files

    var tsResult = gulp.src(appTsFiles)
                       .pipe(sourcemaps.init())
                       .pipe(tsc(typeScriptCompilerOptions));

        tsResult.dts.pipe(gulp.dest(config.appJsOutputFolder));
        return tsResult.js
                        .pipe(sourcemaps.write('.'))
                        .pipe(gulp.dest(config.appJsOutputFolder));
});


/**
 * Compile TypeScript and include references to library and app .d.ts files.
 */
gulp.task('compile-samples', ['compile-app'], function () {
    var sampleTsFiles = [
        config.allSampleTsFiles,              // path to typescript files
        config.libraryTypeScriptDefinitions   // reference to library .d.ts files
    ]; 

    var tsResult = gulp.src(sampleTsFiles)
                       //.pipe(sourcemaps.init())
                       .pipe(tsc(typeScriptCompilerOptions));

        tsResult.dts.pipe(gulp.dest(config.samplesJsOutputFolder));
        return tsResult.js
                        //.pipe(sourcemaps.write('.'))
                        .pipe(gulp.dest(config.samplesJsOutputFolder));
});

/**
 * Compile TypeScript and include references to library and app .d.ts files.
 */
function compileTest(){
    var testTsFiles = [
        //config.allAppTsFiles,                 // needed for compilation, are filtered from the result stream
        config.allTestTsFiles,                // path to typescript test files
        config.libraryTypeScriptDefinitions   // reference to library .d.ts files
    ]; 

    var tsResult = gulp.src(testTsFiles)
                       .pipe(tsc(typeScriptCompilerOptions));

    tsResult.dts.pipe(gulp.dest(config.testJsOutputFolder));
        
    return tsResult.js
                   .pipe(gulp.dest(config.testJsOutputFolder));
}

gulp.task('compile-test-app-dependent', ['compile-app'], compileTest);
gulp.task('compile-test', compileTest);


gulp.task('bundle-app', ['compile-app'], function () {
    // concat source scripts
    gulp.src(config.allAppJsFiles)
        .pipe(concat(config.appBundleName))
        .pipe(gulp.dest(config.bundleFolder));
});


gulp.task('bundle-app-uglify', ['compile-app'], function () {
    // concat and uglify source scripts
    gulp.src(config.allAppJsFiles)
        .pipe(uglify())
        .pipe(concat(config.appBundleNameMinified))
        .pipe(gulp.dest(config.bundleFolder));
});


gulp.task('bundle-app-definitions', function () {
    // TODO concat app definitions and bundle them in one file in the ./dist/ folder
    var appDefinitionFiles = [
        config.typingsFolder + config.appDefinitionBundleName
    ];

    gulp.src(appDefinitionFiles)
        //.pipe(concat(config.appDefinitionBundleName))
        .pipe(gulp.dest(config.bundleFolder));
});


function startKarma(options) {
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
    
    return gulp
        .src(config.allTestFiles)
        .pipe(stream);    
}

gulp.task('test', ['compile-test'], function () {
    var options = {
        configFile: path.resolve(config.testFolder + 'karma.conf.js'),
        singleRun: true,
        autoWatch: false
    };

    return startKarma(options);
});


gulp.task('test-watch', ['compile-test'], function () {
    var appTsFiles = [config.allAppTsFiles,                 // path to typescript files
                      config.libraryTypeScriptDefinitions]; // reference to library .d.ts files

    gulp.watch([appTsFiles], ['compile-test-app-dependent']);
    gulp.watch([config.allTestTsFiles], ['compile-test']);
    
    var options = {
        configFile: path.resolve(config.testFolder + 'karma.conf.js'),
        singleRun: false,
        autoWatch: true
    };
    
    startKarma(options);
});