'use strict';
var GulpConfig = (function () {
    
    function gulpConfig() {
        this.libraryVersion = '1.8.2';        
        // folder definitions        
        this.baseFolder = './';
        
        this.sourceFolder = this.baseFolder + 'src/';
        this.samplesFolder = this.baseFolder + 'samples/';
        this.testFolder = this.baseFolder + 'test/';
        this.typingsFolder = this.baseFolder + 'tools/typings/';
        
        // TypeScript source definitions
        this.libraryTypeScriptDefinitions = this.typingsFolder + '**/*d.ts';
        this.allAppTsFiles = this.sourceFolder + 'ts/**/*.ts';
        this.allSampleTsFiles = this.samplesFolder + 'ts/**/*.ts';
        this.allTestTsFiles = this.testFolder + 'tests/ts/**/*.ts';
        this.allPerformanceTestTsFiles = this.testFolder + 'performance-tests/ts/**/*.ts';

        // JavaScript output definitions
        this.appJsOutputFolder = this.sourceFolder + 'js/';
        this.samplesJsOutputFolder = this.samplesFolder + 'js/';
        this.testJsOutputFolder = this.testFolder + 'tests/js/';
        this.performanceTestsJsOutputFolder = this.testFolder + 'performance-tests/js/';
        this.testCoverageOutputFolder = this.testFolder + 'coverage/app-src/';
        
        // Output bundle definitions
        this.bundleFolder = this.baseFolder + 'dist/';
        this.appBundleName = 'automapper.js';
        this.appBundleNameMinified = 'automapper.min.js';

        this.allAppDefinitionFiles = [
            this.typingsFolder + 'automapper-classes.d.ts',
            this.typingsFolder + 'automapper-interfaces.d.ts',
            this.typingsFolder + 'automapper-declaration.d.ts'
        ];
        this.appDefinitionBundleName = 'automapper.d.ts';
        
        this.allAppJsFiles = [
            this.appJsOutputFolder + 'AutoMapperHelper.js',
            this.appJsOutputFolder + 'AutoMapperValidator.js',
            this.appJsOutputFolder + 'AutoMapperEnumerations.js',
            this.appJsOutputFolder + 'AutoMapperBase.js',
            this.appJsOutputFolder + 'AsyncAutoMapper.js',
            this.appJsOutputFolder + 'AutoMapper.js',
            this.appJsOutputFolder + '**/*.js',
            //this.appJsOutputFolder + '**/*.js.map',
            //this.sourceFolder + 'ts/**/*.ts',
            '!' + this.samplesJsOutputFolder + '**/*.js'
            ];

        this.allTestFiles = [
            // this.testCoverageOutputFolder + 'automapper.min.js',
            this.testCoverageOutputFolder + 'AutoMapperHelper.js',
            this.testCoverageOutputFolder + 'AutoMapperValidator.js',
            this.testCoverageOutputFolder + 'AutoMapperEnumerations.js',
            this.testCoverageOutputFolder + 'AutoMapperBase.js',
            this.testCoverageOutputFolder + 'AsyncAutoMapper.js',
            this.testCoverageOutputFolder + 'AutoMapper.js',
            this.testCoverageOutputFolder + '**/*.js',
            this.testFolder + 'scripts/jasmine-utils.js',
            this.testJsOutputFolder + '**/*.js'
        ];
        
        this.libraryHeaderTemplate = '/*!\n\
 * TypeScript / Javascript AutoMapper Library v${version}\n\
 * ${url}\n\
 *\n\
 * Copyright 2015-2017 ${organization} and other contributors\n\
 * Released under the ${license} license\n\
 *\n\
 * Date: ${currentDate}\n\
 */\n',
        this.libraryOrganization = 'Interest IT / Bert Loedeman',
        this.libraryUrl = 'https://github.com/loedeman/AutoMapper',
        this.libraryLicense = 'MIT'
        
        this.currentDate = getCurrentDate();
    }
    
    function getCurrentDate() {
        var now = new Date();
        return new Date(now.getFullYear(),
                        now.getMonth(),
                        now.getDate(),
                        18, 0, 0, 0);
    }
    
    return gulpConfig;
})();
module.exports = GulpConfig;