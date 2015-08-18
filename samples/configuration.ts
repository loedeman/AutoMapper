class Base {
    public apiJsonResult: any;
}

class Person extends Base {

}

(() => {
    var sourceKey = 'source-001';
    var destinationKey = 'destination-001';

    var apiJsonResult = { fullName: 'John Doe', birthday: '2000-01-01T00:00:00' };

    automapper
        .createMap(sourceKey, destinationKey)
        .forMember('name', (opts: AutoMapperJs.IMemberConfigurationOptions) => opts.mapFrom('fullName'))
        .forMember('apiJsonResult', (opts: AutoMapperJs.IMemberConfigurationOptions) => opts.sourceObject) // TODO not tested!!!
        .convertToType(Person);

    automapper.map(sourceKey, destinationKey, apiJsonResult);
})();
