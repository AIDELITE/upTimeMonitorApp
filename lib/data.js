/*
* Library for storing and edittting data
*
*/
//dependencies
var fs = require('fs');
var path = require('path');

//container for the module (to the exported)
var lib = {};

//define the base directory for the datab folder relative to the working directory

//write data to file

lib.create = function(dir,file,data,callback){
    //first open the file for writing.
    fs.writeFileSync
}



//export for the container
module.exports = lib;