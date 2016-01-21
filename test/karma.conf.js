module.exports = function (config) {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '../',

        // frameworks to use
        frameworks: ['jasmine'],

        plugins: [
             'karma-coverage',
             'karma-jasmine',
             'karma-phantomjs-launcher'
        ],

        // list of files to exclude
        exclude: [],

        // preprocess matching files before serving them to the browser
        //preprocessors: {
        //    'src/js/**/*.js': ['coverage']
        //},

        // test results reporter to use - possible values: 'dots', 'progress'
        reporters: ['progress', 'coverage'],

        coverageReporter: {
              type: 'lcov'
            , dir: './test/coverage'
            , subdir: function (browser) {
                return browser.toLowerCase().split(/[ /-]/)[0];
              }
            , file: 'index.html'
            //, instrumenterOptions: {
            //    istanbul: {
            //        noCompact: true,
            //        preserveComments: true
            //    }
            //  }
            , includeAllSources: true
            //, verbose: true
        },

        // web server port
        port: 19999,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_DEBUG,

        // start these browsers
        browsers: ['PhantomJS']
    });
};