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
var _logs = require('./logs');
var utl = require('util');
var debug = utl.debuglog('workers');

//instantiate the worker object
var workers = {};

//look up all checks, get their data and send it to a validator
workers.gatherAllChecks = ()=>{
    //get all the checks
    _data.list('checks',(err, checksData)=>{
        if(!err && checksData && checksData.length > 0){
            checksData.forEach((check)=>{
                //read in th check data
                _data.read('checks',check,(er,originalCheckData)=>{
                    if(!er && originalCheckData){
                        //pass it to the check validator and let that function continue or log errors as needed
                        workers.validateCheckData(originalCheckData);
                    }else{
                        debug("Error in reading on of the checks data",er);
                    }
                })
            });
        }else{
            debug("Error: Could not find any logs");
        }
    })
}

//sanity-check the checkdata
workers.validateCheckData = (originalCheckData)=>{
    originalCheckData = typeof(originalCheckData)=='object' && originalCheckData !==null? originalCheckData : {};
    originalCheckData.id = typeof(originalCheckData.id)=='string' && originalCheckData.id.trim().length == 20? originalCheckData.id.trim(): false;
    originalCheckData.userPhone = typeof(originalCheckData.userPhone)=='string' && originalCheckData.userPhone.trim().length == 10? originalCheckData.userPhone.trim(): false;
    originalCheckData.protocol = typeof(originalCheckData.protocol)=='string' && ['http','https'].indexOf(originalCheckData.protocol) >-1? originalCheckData.protocol : false;
    originalCheckData.url = typeof(originalCheckData.url)=='string' && originalCheckData.url.trim().length > 0? originalCheckData.url.trim(): false;
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
        debug("Error: one of the checks is not properly formatted. skipp it");
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
        'protocol': originalCheckData.protocol+':',
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
    req.on('timeout',(e)=>{
        //update the check data and pass the data along
        checkOutcome.error = {
            'error': true,
            'value': 'timeout'
        };

        if(!outcomeSent){
            workers.processCheckOutcome(originalCheckData,checkOutcome);
            outcomeSent = true;
        }
    });

    //end the request
    req.end();
}

//Process the check outcome, update the check data as needed and trigger an alert
//Special logic for accomodating a check that has never been tested before (don't alert on that one)
workers.processCheckOutcome = (originalCheckData,checkOutcome)=>{
    //decide if the check is considered up or down
    var state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1? 'up':'down';

    //decide if the alert is warranted
    var alertwarranted = originalCheckData.lastChecked && originalCheckData.state !==state? true : false;

    var timeOfCheck = Date.now();
    workers.log(originalCheckData,checkOutcome,state,alertwarranted,timeOfCheck);
    //Update the check data
    var newcheckData = originalCheckData;
    newcheckData.state = state;
    newcheckData.lastChecked = timeOfCheck;

    //save the data
    _data.update('checks',newcheckData.id,newcheckData,(err)=>{
        if(!err){
            //Send the new check data to the next process if needed
            if(alertwarranted){
                //send an alert to the user
                workers.alertUserToStatusChange(newcheckData);
            }else{
                debug("Check outcome has not changed, no alerts needed");
            }
        }else{
            debug("Error trying to save data to one of the checks");
        }
    });
}

workers.log =(originalCheckData,checkOutcome,state,alertwarranted,timeOfCheck)=>{
    //form the log data
    var logData = {
        'check': originalCheckData,
        'outcome': checkOutcome,
        'state': state,
        'alert': alertwarranted,
        'time': timeOfCheck
    }

    //convert data to string
    var logString = JSON.stringify(logData);

    //Determine the name of the log file
    var logFileName = originalCheckData.id;

    //Append the log string to the file
    _logs.append(logFileName,logString,(err)=>{
        if(!err){
            debug("Logging to file successfull");
        }else{
            debug("Something went wrong ",err);
        }
    })
}

//Alert user as to the change in status change
workers.alertUserToStatusChange = (newcheckData)=>{
    var msg = 'Alert: Your Check For '+newcheckData.method.toUpperCase()+' '+newcheckData.protocol+'://'+newcheckData.url+' is Currently '+newcheckData.state;
    var phone = newcheckData.userPhone;
    helpers.sendSMSTOUSER(phone,msg,(err,res)=>{
        if(!err && res){
            debug(res);
        }else{
            debug("Message wasnt sent",res);
        }
    })

    debug(msg);
}


//Timer to execute the worker-process per minute
workers.loop = ()=>{
    setInterval(()=>{
        workers.gatherAllChecks();
    },1000 * 5);
}

//Timer to execute the log rotation process once per day
workers.logRotationLoop = ()=>{
    setInterval(()=>{
        workers.rotateLogs();
    },1000 * 60 * 60 * 24);
}

//Rotate (Compress) the log files
workers.rotateLogs = ()=>{
    //list all the (none compressed) log files
    _logs.list(false,(err,logs)=>{
        if(!err && logs){
            logs.forEach((logName)=>{
            //compress the data to a different file
                var logId = logName.replace('.log','');
                var newFileId = logId+'-'+Date.now();
                _logs.compress(logId,newFileId,(err)=>{
                    if(!err){
                        //Truncate the log
                        _logs.truncate(logId,(err)=>{
                            if(!err){
                                debug("Success trancating logFile");
                            }else{
                                debug("Error truncating on of the logs")
                            }
                        })
                    }else{
                        debug("Error compressing on of the logs",err);
                    }
                })
            })
        }else{
            debug("Error: could not find any logs to rotate");
        }
    })
}

//init script
workers.init = ()=>{
    //send to console , in yellow
    console.log('\x1b[33m%s\x1b[0m','Background workers are running');

    //execute all checks immediately
    workers.gatherAllChecks();
    //call the loop so checks will execute later on
    workers.loop();

    //compress all the logs immediately
    workers.rotateLogs();

    //call the compression loop so logs will be comressed later on
    workers.logRotationLoop();
}

//export the module
module.exports = workers;