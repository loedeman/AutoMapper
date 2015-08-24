'use strict';

var gulp = require('gulp');
var debug = require('gulp-debug');
var inject = require('gulp-inject');
var tsc = require('gulp-typescript');
var tslint = require('gulp-tslint');
var sourcemaps = require('gulp-sourcemaps');
var del = require('del');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
    
var gulpKarma = require('./tools/gulp/gulp-karma.js');
    
var Config = require('./gulp.config.js');
var config = new Config();

gulp.task('default', ['compile-app']);

gulp.task('watch', function() {
    gulp.watch([config.allTypeScript], ['compile-app']);
});

gulp.task('release', ['compile-app', 'test-app-dependent', 'compile-samples', 'distribute']);

/** lint TypeScript files to ensure high quality code. */
gulp.task('ts-lint', function () {
    var tsFiles = [config.allAppTsFiles, config.allSampleTsFiles];
    return gulp.src(tsFiles).pipe(tslint()).pipe(tslint.report('prose'));
});

/** compile TypeScript and include references to library and app .d.ts files. */
gulp.task('compile-app', ['ts-lint'], function () {
    var appTsFiles = [config.allAppTsFiles,                 // path to typescript files
                      config.libraryTypeScriptDefinitions]; // reference to library .d.ts files

    var tsResult = gulp.src(appTsFiles)
                       .pipe(sourcemaps.init())
                       .pipe(tsc(config.tscOptions));

        tsResult.dts.pipe(gulp.dest(config.appJsOutputFolder));
        return tsResult.js
                        .pipe(sourcemaps.write('.'))
                        .pipe(gulp.dest(config.appJsOutputFolder));
});


/** compile TypeScript sample files. */
gulp.task('compile-samples', ['compile-app'], function () {
    var sampleTsFiles = [
        config.allSampleTsFiles,              // path to typescript files
        config.libraryTypeScriptDefinitions   // reference to library .d.ts files
    ]; 

    var tsResult = gulp.src(sampleTsFiles)
                       .pipe(sourcemaps.init())
                       .pipe(tsc(config.tscOptions));

        tsResult.dts.pipe(gulp.dest(config.samplesJsOutputFolder));
        return tsResult.js
                        .pipe(sourcemaps.write('.'))
                        .pipe(gulp.dest(config.samplesJsOutputFolder));
});

/** compile TypeScript test files. */
function compileTest() {
    var testTsFiles = [
        config.allTestTsFiles,                // path to typescript test files
        config.libraryTypeScriptDefinitions   // reference to library .d.ts files
    ]; 

    var tsResult = gulp.src(testTsFiles).pipe(tsc(config.tscOptions));
    tsResult.dts.pipe(gulp.dest(config.testJsOutputFolder));
    return tsResult.js.pipe(gulp.dest(config.testJsOutputFolder));
}

/** compile TypeScript test files (dependency to compile-app). */
gulp.task('compile-test-app-dependent', ['compile-app'], compileTest);

/** compile TypeScript test files. */
gulp.task('compile-test', compileTest);

/** distribute JS output files. */
gulp.task('distribute', ['bundle-app', 'bundle-app-uglify', 'distribute-app-definitions']);

/** bundle app JS output files. */
gulp.task('bundle-app', ['compile-app'], function () {
    // concat source scripts
    gulp.src(config.allAppJsFiles)
        .pipe(concat(config.appBundleName))
        .pipe(gulp.dest(config.bundleFolder));
});


/** bundle and uglify app JS output files. */
gulp.task('bundle-app-uglify', ['compile-app'], function () {
    // concat and uglify source scripts
    gulp.src(config.allAppJsFiles)
        .pipe(uglify())
        .pipe(concat(config.appBundleNameMinified))
        .pipe(gulp.dest(config.bundleFolder));
});

/** distribute app TypeScript definition files. */
gulp.task('distribute-app-definitions', function () {
    var appDefinitionFiles = [
        config.typingsFolder + config.appDefinitionBundleName
    ];

    gulp.src(appDefinitionFiles)
        .pipe(gulp.dest(config.bundleFolder));
});

/** execute test files (dependency to compile-test). */
gulp.task('test', ['compile-test'], function () {
    return gulp
        .src(config.allTestFiles)
        .pipe(gulpKarma({
            configFile: config.testFolder + 'karma.conf.js',
            singleRun: true,
            autoWatch: false
        }));    
});

/** execute test files (dependency to compile-test-app-dependent). */
gulp.task('test-app-dependent', ['compile-test-app-dependent'], function () {
    return gulp
        .src(config.allTestFiles)
        .pipe(gulpKarma({
            configFile: config.testFolder + 'karma.conf.js',
            singleRun: true,
            autoWatch: false
        }));    
});

/** watch app and test test files (dependency to compile-test). */
gulp.task('test-watch', ['compile-test'], function () {
    gulp.watch([config.allAppTsFiles, config.libraryTypeScriptDefinitions], ['compile-test-app-dependent']);
    gulp.watch([config.allTestTsFiles], ['compile-test']);
    
    gulp
        .src(config.allTestFiles)
        .pipe(gulpKarma({
            configFile: config.testFolder + 'karma.conf.js',
            singleRun: false,
            autoWatch: true
        }));    
});