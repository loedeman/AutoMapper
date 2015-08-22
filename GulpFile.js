'use strict';

var gulp = require('gulp'),
    debug = require('gulp-debug'),
    inject = require('gulp-inject'),
    tsc = require('gulp-typescript'),
    tslint = require('gulp-tslint'),
    sourcemaps = require('gulp-sourcemaps'),
    del = require('del'),
    Config = require('./gulp.config.js'),
    tsProject = tsc.createProject('tsconfig.json'),
    gulpKarma = require('gulp-karma'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify');

var config = new Config();


gulp.task('watch', function() {
    gulp.watch([config.allTypeScript], 
               [
                   'ts-lint', 
                   'compile-app', 
                   'compile-test',
                   'bundle-app', 
                   'bundle-app-uglify', 
                   'bundle-app-definitions'
               ]);
});


gulp.task('default', ['ts-lint', 
                      'compile-app',
                      'compile-test', 
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
gulp.task('compile-app', function () {
    var appTsFiles = [config.allAppTsFiles,                 // path to typescript files
                      config.libraryTypeScriptDefinitions]; // reference to library .d.ts files

    var tsResult = gulp.src(appTsFiles)
                       .pipe(sourcemaps.init())
                       .pipe(tsc(tsProject));

        tsResult.dts.pipe(gulp.dest(config.appJsOutputFolder));
        return tsResult.js
                        .pipe(sourcemaps.write('.'))
                        .pipe(gulp.dest(config.appJsOutputFolder));
});


/**
 * Compile TypeScript and include references to library and app .d.ts files.
 */
gulp.task('compile-samples', function () {
    var sampleTsFiles = [
        config.allSampleTsFiles,              // path to typescript files
        config.libraryTypeScriptDefinitions   // reference to library .d.ts files
    ]; 

    var tsResult = gulp.src(sampleTsFiles)
                       //.pipe(sourcemaps.init())
                       .pipe(tsc(tsProject));

        tsResult.dts.pipe(gulp.dest(config.samplesJsOutputFolder));
        return tsResult.js
                        //.pipe(sourcemaps.write('.'))
                        .pipe(gulp.dest(config.samplesJsOutputFolder));
});

/**
 * Compile TypeScript and include references to library and app .d.ts files.
 */
gulp.task('compile-test', function () {
    var testTsFiles = [
        config.allAppTsFiles, 
        config.allTestTsFiles,              // path to typescript files
        config.libraryTypeScriptDefinitions   // reference to library .d.ts files
    ]; 

    var tsResult = gulp.src(testTsFiles)
                       //.pipe(sourcemaps.init())
                       .pipe(tsc(tsProject));

        tsResult.dts.pipe(gulp.dest(config.testJsOutputFolder));
        return tsResult.js
                        //.pipe(sourcemaps.write('.'))
                        .pipe(gulp.dest(config.testJsOutputFolder));
});


/**
 * Remove all generated JavaScript files from TypeScript compilation.
 */
gulp.task('clean-ts', function (cb) {
    var typeScriptGenFiles = [
        config.tsOutputPath +'/**/*.js',    // path to all JS files auto gen'd by editor
        config.tsOutputPath +'/**/*.js.map', // path to all sourcemap files auto gen'd by editor
        '!' + config.tsOutputPath + '/lib'
    ];

  // delete the files
  del(typeScriptGenFiles, cb);
});


gulp.task('bundle-app', function () {
    // concat source scripts
    gulp.src(config.allAppJsFiles)
        .pipe(concat(config.appBundleName))
        .pipe(gulp.dest(config.bundleFolder));
});


gulp.task('bundle-app-uglify', function () {
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


gulp.task('test', function () {
    //console.log(config.allTestFiles);
    // Be sure to return the stream from gulp-karma to gulp (only when action is 'run')
    return gulp
        .src(config.allTestFiles)
        .pipe(gulpKarma({
            configFile: config.testFolder + '/karma.conf.js',
            action: 'run'
        }))
        .on('error', function (err) {
            throw err;
        })
    ;
});


gulp.task('test-watch', function () {
    gulp
        .src(config.allTestFiles)
        .pipe(gulpKarma({
            configFile: config.testFolder + '/karma.conf.js',
            action: 'watch'
        }))
        .on('error', function (err) {
            throw err;
        })
    ;
});