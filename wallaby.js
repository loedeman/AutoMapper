module.exports = function (wallaby) {
  return {
    files: [
      // load enumeration files
      'src/ts/**/*Enumerations.ts',
      'src/ts/**/*Enumeration.ts',
      'src/ts/**/*Enum.ts',

      // load base classes 
      'src/ts/**/*Base.ts',
      'src/ts/**/Base*.ts',
      
      // load everything
      'src/ts/**/*.ts',

      // load library files
      { pattern: 'test/scripts/jasmine-utils.js', instrument: false }
    ],

    tests: [
      'test/tests/ts/**/*specs.ts'
    ]
  };
};