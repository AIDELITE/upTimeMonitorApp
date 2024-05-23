/*
/ worker related tasks
*/
//dependencies
var path = require('path');
var fs = require('fs');
var _data = require('./data');
var http = require('http');
var https = require('https');
var helpers = require('./helpers');
var url = require('url');

//instantiate the worker object
var workers = {};

//look up all checks, get their data and send it to a validator
workers.gatherAllChecks = ()=>{
    //get all the checks
    _data.list('checks',(err, checksData)=>{
        if(!err && checksData && checksData.length > 0){
            checksData.forEach((check)=>{
                //read in th check data
                _data.read('ckecks',check,(er,originalCheckData)=>{
                    if(!er && originalCheckData){
                        //pass it to the check validator and let that function continue or log errors as needed
                        workers.validateCheckData(originalCheckData);
                    }else{
                        console.log("Error in reading on of the checks data");
                    }
                })
            });
        }else{
            console.log("Error: Could not find any logs");
        }
    })
}

//sanity-check the checkdata
workers.validateCheckData = (originalCheckData)=>{
    originalCheckData = typeof(originalCheckData)=='object' && originalCheckData !==null? originalCheckData : {};
    originalCheckData.id = typeof(originalCheckData.id)=='string' && originalCheckData.id.trim() == 20? originalCheckData.id.trim(): false;
    originalCheckData.userPhone = typeof(originalCheckData.userPhone)=='string' && originalCheckData.userPhone.trim() == 10? originalCheckData.userPhone.trim(): false;
    originalCheckData.protocol = typeof(originalCheckData.protocol)=='string' && ['http','https'].indexOf(originalCheckData.protocol) >-1? originalCheckData.protocol : false;
    originalCheckData.url = typeof(originalCheckData.url)=='string' && originalCheckData.url.trim() > 0? originalCheckData.url.trim(): false;
    originalCheckData.method = typeof(originalCheckData.method)=='string' && ['post','put','get','delete'].indexOf(originalCheckData.method) >-1? originalCheckData.method : false;
    originalCheckData.successCodes = typeof(originalCheckData.successCodes)=='object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0? originalCheckData.successCodes: false;
    originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds)=='number' && originalCheckData.timeoutSeconds % 1===0 && originalCheckData.timeoutSeconds >=1 && originalCheckData.timeoutSeconds <=5? originalCheckData.timeoutSeconds : false;

    //set the keys that may not be set (if the workers have never seen this check)


}

//Timer to execute the worker-process per minute
workers.loop = ()=>{
    setInterval(()=>{
        workers.gatherAllChecks();
    },1000 * 60);
}

//init script
workers.init = ()=>{
    //execute all checks immediately
    workers.gatherAllChecks();
    //call the loop so checks will execute later on
    workers.loop();
}

//export the module
module.exports = workers;