var fs = require('fs');

// Consts
var PLUGIN_NAME = 'automapper-ts';

// Read and eval library
eval(fs.readFileSync('./node_modules/automapper-ts/dist/automapper.js', 'utf8'));

// Exporting the plugin main function
module.exports = this.automapper;