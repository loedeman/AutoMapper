/// <reference path="mapping-framework.ts" />

/// <reference path="../../../dist/automapper.d.ts" />
module AutoMapperJS {
	'use strict';
	
	export class SimpleMappingPerformance {
		public execute(repetitions: number = 1* 1000 * 1000): Array<AutoMapperJS.IPerformanceTestResult> {
			var result = new Array<AutoMapperJS.IPerformanceTestResult>();
			
			var executeRepeatFunc = (action: () => void): void => {
				for (var repetition = 0; repetition < repetitions; repetition++) {
					action();
				}
			}
			
			result.push(this.executeMappingDefaults(executeRepeatFunc, repetitions));
			result.push(this.executeSimpleMapping(executeRepeatFunc, repetitions));
			result.push(this.executeOverruleMapping(executeRepeatFunc, repetitions));
			result.push(this.executeMapFromMapping(executeRepeatFunc, repetitions));
			
			return result;
		}
		
		private executeMappingDefaults(executeRepeatFunc: (action: () => void) => void, repetitions: number): IPerformanceTestResult {			
			var fromObj = { 
				prop1: 'Value1', 
				prop2: 'Value2', 
			};
			
			var t0 = performance.now();

			var from = '31a59aa6-daa6-4b5e-968e-8b724943d0b7';
			var to = '0a89f8f5-0989-4b39-9e15-5d1f35a1ca03';
						
			automapper
				.createMap(from, to);

			var t1 = performance.now();

			executeRepeatFunc(()=> {
				automapper.map(from, to, fromObj);
			});
			
			var t2 = performance.now();

			// old school hard coded comparable functionality
			var oldSchoolT1 = performance.now();
			
			executeRepeatFunc(()=> {
				var toObj = <any>{};
				toObj.prop1 = fromObj.prop1;
				toObj.prop2 = fromObj.prop2;
			});			
			
			var oldSchoolT2 = performance.now();
			
			return {
				class: 'SimpleMappingPerformance',
				test: 'executeMappingDefaults',
				repetitions: repetitions,
				creationTimeInMs: t1-t0,
				executionTimeInMs: t2-t1,
				referenceExecutionTimeInMs: oldSchoolT2 - oldSchoolT1
			};
		}

		private executeSimpleMapping(executeRepeatFunc: (action: () => void) => void, repetitions: number): IPerformanceTestResult {			
			var fromObj = { 
				prop1: 'Value1', 
				prop2: 'Value2' 
			};
			
			var t0 = performance.now();

			var from = '31a59aa6-daa6-4b5e-968e-7c724943d0b8';
			var to = '0b89f8f5-0989-4b39-9e15-51ef35a1ca03';
						
			automapper
				.createMap(from, to)
				.forMember('prop1', (opts: AutoMapperJs.IMemberConfigurationOptions) => opts.sourceObject[opts.sourcePropertyName])
				.forMember('prop2', (opts: AutoMapperJs.IMemberConfigurationOptions) => opts.sourceObject[opts.sourcePropertyName])
			;

			var t1 = performance.now();

			executeRepeatFunc(()=> {
				automapper.map(from, to, fromObj);
			});
			
			var t2 = performance.now();
			
			// old school hard coded comparable functionality
			var oldSchoolT1 = performance.now();
			
			executeRepeatFunc(()=> {
				var toObj = <any>{};
				toObj.prop1 = fromObj.prop1;
				toObj.prop2 = fromObj.prop2;
			});			
			
			var oldSchoolT2 = performance.now();

			return {
				class: 'SimpleMappingPerformance',
				test: 'executeSimpleMapping',
				repetitions: repetitions,
				creationTimeInMs: t1-t0,
				executionTimeInMs: t2-t1,
				referenceExecutionTimeInMs: oldSchoolT2 - oldSchoolT1
			};
		}
		
		private executeOverruleMapping(executeRepeatFunc: (action: () => void) => void, repetitions: number): IPerformanceTestResult {
	        var fromObj = { prop1: 'From A', prop2: 'From A too' };

			var fromKey = '{7AC4134B-ECC1-464B-B144-5B9D8F5B568E}';
			var toKey = '{2BDE907C-1CE6-4CC5-A601-9A94CC665837}';

			var t0 = performance.now();
			
			automapper
				.createMap(fromKey, toKey)
				.forMember('prop1', (opts: AutoMapperJs.IMemberConfigurationOptions) => { opts.mapFrom('prop2'); })
				.forMember('prop1', (opts: AutoMapperJs.IMemberConfigurationOptions) => { opts.ignore(); });
	
			var t1 = performance.now();
			
			executeRepeatFunc(()=> {
				automapper.map(fromKey, toKey, fromObj);
			});
			
			var t2 = performance.now();			

			// old school hard coded comparable functionality
			var oldSchoolT1 = performance.now();
			
			executeRepeatFunc(()=> {
				var toObj = <any>{};
			});			
			
			var oldSchoolT2 = performance.now();

			return {
				class: 'SimpleMappingPerformance',
				test: 'executeOverruleMapping',
				repetitions: repetitions,
				creationTimeInMs: t1-t0,
				executionTimeInMs: t2-t1,
				referenceExecutionTimeInMs: oldSchoolT2 - oldSchoolT1
			};
		}

		private executeMapFromMapping(executeRepeatFunc: (action: () => void) => void, repetitions: number): IPerformanceTestResult {
	        var fromObj = { prop1: 'From A', prop2: 'From A too' };

			var fromKey = '{7AC4134B-ECC1-464B-B144-5B9D8F5B568E}';
			var toKey = '{2BDE907C-1CE6-4CC5-A601-9A94CC665837}';

			var t0 = performance.now();
			
			automapper
				.createMap(fromKey, toKey)
				.forMember('prop1', (opts: AutoMapperJs.IMemberConfigurationOptions) => { opts.mapFrom('prop2'); })
			;
	
			var t1 = performance.now();
			
			executeRepeatFunc(()=> {
				automapper.map(fromKey, toKey, fromObj);
			});

			var t2 = performance.now();			

			// old school hard coded comparable functionality
			var oldSchoolT1 = performance.now();
			
			executeRepeatFunc(()=> {
				var toObj = <any>{};
				toObj.prop1 = fromObj.prop2;
			});
			
			var oldSchoolT2 = performance.now();

			return {
				class: 'SimpleMappingPerformance',
				test: 'executeOverruleMapping',
				repetitions: repetitions,
				creationTimeInMs: t1-t0,
				executionTimeInMs: t2-t1,
				referenceExecutionTimeInMs: oldSchoolT2 - oldSchoolT1
			};		
		}
	}
}