'use strict';

var gulp = require('gulp');
var replace = require('gulp-replace');
var header = require('gulp-header');
var debug = require('gulp-debug');
var inject = require('gulp-inject');
var tsc = require('gulp-typescript');
var tslint = require('gulp-tslint');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var copy = require('gulp-copy');
var coveralls = require('gulp-coveralls');
var umd = require('gulp-umd');
var path = require('path');

var gulpKarma = require('./tools/gulp/gulp-karma.js');

var Config = require('./gulp.config.js');
var config = new Config();

gulp.task('default', ['compile-app']);

gulp.task('watch', function () {
    gulp.watch([config.allTypeScript], ['compile-app']);
});

gulp.task('release', ['compile-app', 'test-app-dependent', /*'distribute-test-results',*/ 'compile-performance-tests', 'compile-samples', 'distribute']);

/** lint TypeScript files to ensure high quality code. */
gulp.task('ts-lint', function () {
    var tsFiles = [config.allAppTsFiles, config.allSampleTsFiles];
    return gulp
        .src(tsFiles)
        .pipe(tslint({ formatter: 'verbose' }))
        .pipe(tslint.report());
});

/** compile TypeScript and include references to library and app .d.ts files. */
gulp.task('compile-app', ['ts-lint'], function () {
    var tscProject = tsc.createProject('tsconfig.json'/*, {
        outDir: config.bundleFolder,
        outFile: config.appBundleName
    }*/);
    var tsResult = gulp.src([config.allAppTsFiles])
        .pipe(sourcemaps.init())
        .pipe(tscProject());

    tsResult.dts.pipe(gulp.dest(config.appJsOutputFolder));
    return tsResult.js
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(config.appJsOutputFolder));
});

/** compile TypeScript sample files. */
gulp.task('compile-samples', ['distribute'], function () {
    var sampleTsFiles = [
        config.allSampleTsFiles//,              // path to typescript files
        //config.libraryTypeScriptDefinitions   // reference to library .d.ts files
    ];

    var tscProject = tsc.createProject('tsconfig.json');
    var tsResult = gulp.src(sampleTsFiles)
        .pipe(sourcemaps.init())
        .pipe(tscProject());

    tsResult.dts.pipe(gulp.dest(config.samplesJsOutputFolder));
    return tsResult.js
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(config.samplesJsOutputFolder));
});

/** compile TypeScript sample files. */
gulp.task('compile-performance-tests', ['distribute'], function () {
    var performanceTestTsFiles = [
        config.allPerformanceTestTsFiles
    ];

    var tscProject = tsc.createProject('tsconfig.json');
    var tsResult = gulp.src(performanceTestTsFiles)
        .pipe(sourcemaps.init())
        .pipe(tscProject());

    tsResult.dts.pipe(gulp.dest(config.performanceTestsJsOutputFolder));
    return tsResult.js
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(config.performanceTestsJsOutputFolder));
});

/** compile TypeScript test files. */
function compileTest() {
    var tscProject = tsc.createProject('tsconfig.json');
    var tsResult = gulp.src([config.allTestTsFiles]).pipe(tscProject());
    tsResult.dts.pipe(gulp.dest(config.testJsOutputFolder));
    return tsResult.js.pipe(gulp.dest(config.testJsOutputFolder));
}

/** compile TypeScript test files (dependency to compile-app). */
gulp.task('compile-test-app-dependent', ['compile-app'], compileTest);

/** compile TypeScript test files. */
gulp.task('compile-test', compileTest);

gulp.task('copy-test-output-coverage-app-dependent',
    ['compile-test-app-dependent'], function () {
        return gulp.src(config.appJsOutputFolder + '**/*.*')
            .pipe(copy(config.testCoverageOutputFolder, { prefix: 2 }));
    });

gulp.task('copy-test-output-coverage',
    ['compile-test'], function () {
        return gulp.src(config.appJsOutputFolder + '**/*.*')
            .pipe(copy(config.testCoverageOutputFolder, { prefix: 2 }));
    });

/** distribute JS output files. */
gulp.task('distribute', ['bundle-app', 'bundle-app-uglify', 'distribute-app-definitions', 'bundle-app-definitions', 'distribute-app-sync-version']);

/** bundle app JS output files. */
gulp.task('bundle-app', ['compile-app'], function () {
    // concat source scripts
    gulp.src(config.allAppJsFiles)
        .pipe(sourcemaps.init())
        .pipe(concat(config.appBundleName))
        .pipe(umd({
            exports: function () {
                return 'AutoMapperJs';
            },
            namespace: function () {
                return 'AutoMapperJs';
            }
        }))
        .pipe(header(config.libraryHeaderTemplate, {
            organization: config.libraryOrganization,
            url: config.libraryUrl,
            license: config.libraryLicense,
            version: config.libraryVersion,
            currentDate: config.currentDate.toISOString()
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(config.bundleFolder));
});


/** bundle and uglify app JS output files. */
gulp.task('bundle-app-uglify', ['compile-app'], function () {
    // concat and uglify source scripts
    gulp.src(config.allAppJsFiles)
        .pipe(sourcemaps.init())
        .pipe(concat(config.appBundleNameMinified))
        .pipe(uglify())
        .pipe(header(config.libraryHeaderTemplate, {
            organization: config.libraryOrganization,
            url: config.libraryUrl,
            license: config.libraryLicense,
            version: config.libraryVersion,
            currentDate: config.currentDate.toISOString()
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(config.bundleFolder));
});

/** distribute app TypeScript definition files. */
gulp.task('distribute-app-definitions', function () {
    gulp.src(config.allAppDefinitionFiles)
        .pipe(replace('__RemoveForDistribution__', ''))
        .pipe(replace('${libraryVersion}', config.libraryVersion))
        .pipe(gulp.dest(config.bundleFolder));
});

/** bundle app JS output files. */
gulp.task('bundle-app-definitions', ['distribute-app-definitions'], function () {
    // concat source scripts
    gulp.src(config.allAppDefinitionFiles)
        .pipe(replace('__RemoveForDistribution__', ''))
        .pipe(replace('${libraryVersion}', config.libraryVersion))
        .pipe(replace(/\/\/ \[bundle remove start\][^]*?\/\/ \[bundle remove end\]\r?\n?/gmi, ''))
        .pipe(concat(config.appDefinitionBundleName))
        .pipe(gulp.dest(config.bundleFolder));
});

/** syng app version numbers. */
gulp.task('distribute-app-sync-version', function () {
    var appVersionFiles = [
        config.baseFolder + 'bower.json',
        config.baseFolder + 'package.json'
    ];

    gulp.src(appVersionFiles)
        .pipe(replace(/((?:"|')version(?:"|')\s?:\s?(?:"|'))[0-9]{1}\.[0-9]{1}\.[0-9]{1}((?:"|'))/, '$1' + config.libraryVersion + '$2'))
        .pipe(gulp.dest(config.baseFolder));
});

function test() {
    var karmaConfig = {
        configFile: config.testFolder + 'karma.conf.js',
        preprocessors: {},
        singleRun: true,
        autoWatch: false
    };
    karmaConfig.preprocessors[config.testCoverageOutputFolder + '**/*.js'] = ['coverage'];

    return gulp
        .src(config.allTestFiles)
        .pipe(gulpKarma(karmaConfig));
}
/** execute test files (dependency to compile-test). */
gulp.task('test', ['compile-test', 'copy-test-output-coverage'], test);

/** execute test files (dependency to compile-test-app-dependent). */
gulp.task('test-app-dependent', ['compile-test-app-dependent', 'copy-test-output-coverage-app-dependent'], test);

/** watch app and test test files (dependency to compile-test). */
gulp.task('test-watch', ['compile-test', 'copy-test-output-coverage'], function () {
    var karmaConfig = {
        configFile: config.testFolder + 'karma.conf.js',
        //preprocessors: {},
        singleRun: false,
        autoWatch: true
    };
    //karmaConfig.preprocessors[config.testCoverageOutputFolder + '**/*.js'] = ['coverage'];

    gulp.watch([config.allAppTsFiles, config.libraryTypeScriptDefinitions], ['compile-test-app-dependent']);
    gulp.watch([config.allTestTsFiles], ['compile-test', 'copy-test-output-coverage']);

    gulp.src(config.allTestFiles)
        .pipe(gulpKarma(karmaConfig));
});

gulp.task('coveralls', function () {
    return gulp
        .src(config.testFolder + 'coverage/**/lcov.info')
        .pipe(coveralls());
});