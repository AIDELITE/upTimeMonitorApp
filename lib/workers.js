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

//init script
workers.init = ()=>{
    //execute all checks immediately
    workers.gatherAllChecks();
    //call the loop so checks will execute later on
    workers.loop();
}

//export the module
module.exports = workers;