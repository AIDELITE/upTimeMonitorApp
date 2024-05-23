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

        }else{
            console.log("Error: Could not find any logs");
        }
    })
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