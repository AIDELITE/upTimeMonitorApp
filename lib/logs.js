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

//list all the logs and optionally include the compressed logs
lib.list = (includeCompressedLogs,callback)=>{
    fs.readdir(lib.baseDir,(err,data)=>{
        if(!err && data && data.length>0){
            var trimmedFileNames = [];
            data.forEach((fileName)=>{
                //Add the .log files
                if(fileName.indexOf('.log') >-1){
                    trimmedFileNames.push(fileName.replace('.log',''));
                }

                //Add on the .gz files
                if(fileName.indexOf('.gz.b64')> -1 && includeCompressedLogs){
                    trimmedFileNames.push(fileName.replace('.gz.b64'));
                }
            })
            callback(false,trimmedFileNames);
        }else{
            callback(err,data);
        }
    })
}

//compress the content of one .log file into a .gz.b64 file within the same direction
lib.compress = (logId,newField,callback)=>{
    var sourceFile = logId+'.log';
    var destFile = newField+'.gz.b64';

    fs.readFile(lib.baseDir+sourceFile,'utf8',(err,inputString)=>{
        if(!err && inputString){
            //compress the data using gzip
            zlib.gzip(inputString,(err,buffer)=>{
                if(!err && buffer){
                    //send the data to the destinationa file
                    fs.open(lib.baseDir+destFile,'wx',(err,fileDescriptor)=>{
                        if(!err && fileDescriptor){
                            fs.writeFile(fileDescriptor,buffer.toString('base64'),(err)=>{
                                if(!err){
                                    //Close the destination file
                                    fs.close(fileDescriptor,(err)=>{
                                        if(!err){
                                            callback(false);
                                        }else{
                                            callback(err);
                                        }
                                    })
                                }else{
                                    callback(err);
                                }
                            })
                        }else{
                            callback(err);
                        }
                    })

                }else{
                    callback(err);
                }
            })
        }else{
            callback(err);
        }
    });
};

//decompress the contents of a .gz.b64 file into a string
lib.decompress = (fileId,callback)=>{
    var fileName = fileId+'.gz.b64';
    fs.readFile(lib.baseDir+fileName,'utf8',(err,string)=>{
        if(!err && string){
            //Decompress the data
            var inputBuffer = Buffer.from(str,'base64');
            zlib.unzip(inputBuffer,(err,outputBuffer)=>{
                if(!err && outputBuffer){
                    var str = outputBuffer.toString();
                    callback(false,str);
                }else{
                    callback(err);
                }
            })
        }else{
            callback(err);
        }
    });
}

//truncate a log file
lib.truncate = (logId,callback) =>{
    fs.truncate(lib.baseDir+logId+'.log',0,(err)=>{
        if(!err){
            callback(false);
        }else{
            callback(err);
        }
    });
}

//Export the module
module.exports = lib;