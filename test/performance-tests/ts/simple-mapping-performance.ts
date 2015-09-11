/// <reference path="../../../dist/arcady-automapper.d.ts" />
module AutoMapperJS {
	'use strict';
	
	export class SimpleMappingPerformance {
		public execute(repetitions: number = 100000) {
			var executeRepeatFunc = (action: () => void): void => {
				for (var repetition = 0; repetition < repetitions; repetition++) {
					
				}
			}
			
			this.executeWithDefaultMapping(executeRepeatFunc, repetitions);
		}
		
		private executeWithDefaultMapping(executeRepeatFunc: (action: () => void) => void, repetitions: number) {			
			var fromObj = { 
				Prop01: 'Value01', 
				Prop02: 'Value02', 
				Prop03: 'Value03', 
				Prop04: 'Value04', 
				Prop05: 'Value05', 
				Prop06: 'Value06', 
				Prop07: 'Value07', 
				Prop08: 'Value08', 
				Prop09: 'Value09', 
				Prop10: 'Value10' 
			};
			
			var t0 = performance.now();

			var from = '31a59aa6-daa6-4b5e-968e-8b724943d0b7';
			var to = '0a89f8f5-0989-4b39-9e15-5d1f35a1ca03';
						
			automapper
				.createMap(from, to);

			var t1 = performance.now();

			executeRepeatFunc(()=> {
				automapper.map(from, to)
			});
			
			var t2 = performance.now();
			
			console.log(`Executing SimpleMappingPerformance.executeWithDefaultMapping ${repetitions} times took ${(t2-t0)} milliseconds.`);
		}
	}
}

(() => {
    var simpleMappingPerformanceTests = new AutoMapperJS.SimpleMappingPerformance();
	simpleMappingPerformanceTests.execute();
})();
