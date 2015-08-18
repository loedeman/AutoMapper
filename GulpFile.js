var gulp = require('gulp'),
    gulpKarma = require('gulp-karma'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify');

var srcFiles = [
    'src-js/**/*.js'
];

var testFiles = [];
Array.prototype.push.apply(testFiles, srcFiles);
testFiles.push(
    'test/scripts/jasmine-utils.js',
    'test/tests/**/*.js'
);

gulp.task('default', ['compile', 'compile-uglify', 'test'], function () {
});

gulp.task('watch', ['compile', 'test-watch'], function () {
    gulp.watch(srcFiles, ['compile', 'test-watch']);
});

gulp.task('compile', function () {
    // concat source scripts
    gulp.src(srcFiles)
        .pipe(concat('automapper.js'))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('compile-uglify', function () {
    // concat and uglify source scripts
    gulp.src(srcFiles)
        .pipe(uglify())
        .pipe(concat('automapper.min.js'))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('test', function () {
    // Be sure to return the stream from gulp-karma to gulp (only when action is 'run')
    return gulp
        .src(testFiles)
        .pipe(gulpKarma({
            configFile: 'test/karma.conf.js',
            action: 'run'
        }))
        .on('error', function (err) {
            // Make sure failed tests cause gulp to exit non-zero
            console.log(err);
            throw err;
        })
    ;
});

gulp.task('test-watch', function () {
    gulp
        .src(testFiles)
        .pipe(gulpKarma({
            configFile: 'test/karma.conf.js',
            action: 'watch'
        }))
        .on('error', function (err) {
            // Make sure failed tests cause gulp to exit non-zero
            throw err;
        })
    ;
});