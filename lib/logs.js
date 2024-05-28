/*
/this is a lib for storing and rotating logs
*/

//dependencies
var fs = require('fs');
var path = require('path');
var zlib = require('zlib');

//container for the module

var lib = {};

//base directory for the lib folder
lib.baseDir = path.join(__dirname,'/../.logs/');

//append a string to a file
lib.append = (file,str,callback)=>{
    //open the file for appending
    fs.open(lib.baseDir+file+'.log','a',(err,fileDescriptor)=>{
        if(!err && fileDescriptor){
            fs.appendFile(fileDescriptor,str+"\n",(err)=>{
                if(!err){
                    fs.close(fileDescriptor,(err)=>{
                        if(!err){
                            callback(false);
                        }else{
                            callback('Error closing the file that was appended');
                        }
                    });
                }else{
                    callback('Error appending to file');
                }
            });
        }else{
            callback("Could not open file for appending");
        }
    })
}


//Export the module
module.exports = lib;