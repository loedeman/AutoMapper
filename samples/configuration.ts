module AutoMapperJs.Samples {
    export class Base {
        public apiJsonResult: any;
    }

    export class Person extends Base {

    }

    export class ForMemberSamples {
        public static simpleMapFrom(log: boolean = true) {
            const sourceKey = 'simpleMapFrom';
            const destinationKey = '{}';

            const sourceObject = { fullName: 'John Doe' };

            automapper
                .createMap(sourceKey, destinationKey)
                .forMember('name', (opts: AutoMapperJs.IMemberConfigurationOptions) => opts.mapFrom('fullName'));

            var result = automapper.map(sourceKey, destinationKey, sourceObject);

            if(log) console.log(result);
            return result;
        }

        public static stackedForMemberCalls(log: boolean = true) {
            const sourceKey = 'stackedForMemberCalls';
            const destinationKey = 'Person';

            const sourceObject = { birthdayString: '2000-01-01T00:00:00.000Z' };

            automapper
                .createMap(sourceKey, destinationKey)
                .forMember('birthday', (opts: IMemberConfigurationOptions) => opts.mapFrom('birthdayString'))
                .forMember('birthday', (opts: IMemberConfigurationOptions) => new Date(opts.sourceObject[opts.sourcePropertyName]));

            var result = automapper.map(sourceKey, destinationKey, sourceObject);

            if (log) console.log(result);
            return result;
        }
    }
}