/*
* Library for storing and edittting data
*
*/
//dependencies
var fs = require('fs');
var path = require('path');

//container for the module (to the exported)
var lib = {};

//define the base directory for the data folder relative to the working directory
lib.baseDir = path.join(__dirname,'/../.data/');

//write data to file
lib.create = function(dir,file,data,callback){

    //first open the file for writing.
    fs.open(lib.baseDir+dir+'/'+file+'.json','wx',function(err,fileDescriptor){
        if(!err && fileDescriptor){
            //convert data into string
            var stringData = JSON.stringify(data);

            //write to file and close it
            fs.writeFile(fileDescriptor,stringData,function(err){
                if(!err){
                    fs.close(fileDescriptor,function(err){
                        if(!err){
                            callback(false);
                        }else{
                            callback('Error Closing the file');
                        }
                    })
                }else{
                    callback('Error writing to new file');
                }
            })

        }else{
            callback('could not create a new file, it may already exist');
        }
    });
}

//Read data from File

lib.read = function(dir,file,callback){
    //read data from the file
    fs.readFile(lib.baseDir+dir+'/'+file+'.json','utf8',function(err,data){
        callback(err,data);
    });
}

//update data in file

lib.update = function(dir,file, data, callback){
    //open file for writing
    fs.open(lib.baseDir+dir+'/'+file+'.json','r+',function(err,fileDescriptor){
        if(!err && fileDescriptor){
            //convert data into string
            var stringData = JSON.stringify(data);

            //first truncate the file
            fs.ftruncate(fileDescriptor,function(err){
                if(!err){
                    //if the truncating was successfull, write the new data to file
                    fs.writeFile(fileDescriptor,stringData,function(err){
                        if(! err){
                            //if no error, do a file closure
                            fs.close(fileDescriptor, function(err){
                                if(!err)
                                {
                                    callback(false)
                                }else{
                                    callback("Could not close file");
                                }
                            })
                        }else{
                            callback('Could not write new data to file');
                        }
                    })
                }else{
                    callback('Could not trunctae the file');
                }
            })
        }else{
            callback("could not open file for updating, it may not exist yet");
        }
    });
}

//delete a file
lib.delete = function(dir,file,callback){
    //here we use the unlink command to remove the file from the file system
    fs.unlink(lib.baseDir+dir+'/'+file+'.json',function(err){
        if(!err){
            callback(false);
        }else{
            callback("Could not delete a file from the system");
        }
    })
}



//export for the container
module.exports = lib;