/// <reference path="../../dist/arcady-automapper-classes.d.ts" />
/// <reference path="../../dist/arcady-automapper-interfaces.d.ts" />
/// <reference path="../../dist/arcady-automapper-declaration.d.ts" />

module AutoMapperJs.Samples {
    export class Base {
        public apiJsonResult: any;
    }

    export class Person extends Base {

    }

    class MappingProfile implements IProfile {
        public sourceMemberNamingConvention = new PascalCaseNamingConvention();
        public destinationMemberNamingConvention = new CamelCaseNamingConvention();

        public profileName = 'PascalCaseToCamelCase';

        public configure(): void {
            this.sourceMemberNamingConvention = new PascalCaseNamingConvention();
            this.destinationMemberNamingConvention = new CamelCaseNamingConvention();
        }
    }

    export class InitializeSamples {
        public static initialize(): any {
            automapper.initialize((cfg: IConfiguration) => {
                cfg.addProfile(new MappingProfile());
            });

            const sourceKey = 'initialize';
            const destinationKey = '{}';

            const sourceObject = { FullName: 'John Doe' };

            automapper
                .createMap(sourceKey, destinationKey)
                .withProfile('PascalCaseToCamelCase');

            var result = automapper.map(sourceKey, destinationKey, sourceObject);

            return result;
        }
    }

    export class ForMemberSamples {
        public static simpleMapFrom(): any {
            const sourceKey = 'simpleMapFrom';
            const destinationKey = '{}';

            const sourceObject = { fullName: 'John Doe' };

            automapper
                .createMap(sourceKey, destinationKey)
                .forMember('name', (opts: AutoMapperJs.IMemberConfigurationOptions) => opts.mapFrom('fullName'));

            var result = automapper.map(sourceKey, destinationKey, sourceObject);

            return result;
        }

        public static stackedForMemberCalls(): any {
            const sourceKey = 'stackedForMemberCalls';
            const destinationKey = 'Person';

            const sourceObject = { birthdayString: '2000-01-01T00:00:00.000Z' };

            automapper
                .createMap(sourceKey, destinationKey)
                .forMember('birthday', (opts: IMemberConfigurationOptions) => opts.mapFrom('birthdayString'))
                .forMember('birthday', (opts: IMemberConfigurationOptions) => new Date(opts.sourceObject[opts.sourcePropertyName]));

            var result = automapper.map(sourceKey, destinationKey, sourceObject);

            return result;
        }
    }
}