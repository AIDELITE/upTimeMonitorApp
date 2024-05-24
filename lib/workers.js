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
    originalCheckData.state = typeof(originalCheckData.state)=='string' && ['up','down'].indexOf(originalCheckData.state) >-1? originalCheckData.state : 'down';
    originalCheckData.lastChecked = typeof(originalCheckData.lastChecked)=='number' && originalCheckData.lastChecked >0 ? originalCheckData.lastChecked : false;

    //if all the checks pass, pass the data to the next step in the processes.
    if( originalCheckData.id &&
        originalCheckData.userPhone &&
        originalCheckData.protocol &&
        originalCheckData.url &&
        originalCheckData.method &&
        originalCheckData.successCodes &&
        originalCheckData.timeoutSeconds
    ){
        //perform the checks
        workers.performCheck(originalCheckData);
    }else{
        console.log("Error: one of the checks is not properly formatted. skipp it");
    }

}

//perform the check, send the originalCheckData and the outcome of the check process to the next step in the process
workers.performCheck = (originalCheckData) =>{
    //prepare the initial check outcome
    var checkOutcome = {
        'error': false,
        'responseCode': false
    }

    //mark that the outcome has not been sent yet.
    var outcomeSent = false;

    //parse the hostname and the path out of the originalcheckData
    var parsedUrl = url.parse(originalCheckData.protocol+'://'+originalCheckData.url,true);
    var hostname = parsedUrl.hostname;
    var path = parsedUrl.path; //using path and not pathname because we want the query string

    //construct the request
    var requestDetails = {
        'protocol': originalCheckData.protocol,
        'hostname': hostname,
        'method' : originalCheckData.method.toUpperCase(),
        'path': path,
        'timeout': originalCheckData.timeoutSeconds * 1000
    }

    //instantiate the request using either the http or https module
    var moduleToUse = originalCheckData.protocol =='http'? http: https

    var req = moduleToUse.request(requestDetails,(res)=>{
        //Grab the status of the sent request
        var status = res.statusCode;

        //update the checkOutcome and pass the data along
        checkOutcome.responseCode = status;
        if(!outcomeSent){
            workers.processCheckOutcome(originalCheckData,checkOutcome);
            outcomeSent = true;
        }
    });

    //bind to the error thrown so that it doesn't get thrown
    req.on('error',(e)=>{
        //update the check data and pass the data along
        checkOutcome.error = {
            'error': true,
            'value': e
        };

        if(!outcomeSent){
            workers.processCheckOutcome(originalCheckData,checkOutcome);
            outcomeSent = true;
        }
    });

    //bind to the timeout event
    
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