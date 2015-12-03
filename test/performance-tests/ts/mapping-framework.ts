/// <reference path="simple-mapping-performance.ts" />
/// <reference path="simple-mapping-performance-currying.ts" />

/// <reference path="../../../dist/automapper.d.ts" />
module AutoMapperJS {
	'use strict';
	
	export interface IPerformanceTestResult {
		class: string;
		test: string;
		repetitions: number;
		creationTimeInMs: number;
		executionTimeInMs: number;
		referenceExecutionTimeInMs: number;
	}
	
	export class MappingPerformanceTestFrame {
		public execute(repetitions: number = 1* 1000 * 1000): Array<AutoMapperJS.IPerformanceTestResult> {
			var results = new Array<AutoMapperJS.IPerformanceTestResult>();
		
			results.push(...new AutoMapperJS.SimpleMappingPerformance().execute(repetitions));
			results.push(...new AutoMapperJS.SimpleMappingPerformanceWithCurrying().execute(repetitions));
			
			return results;
		}
	}
}