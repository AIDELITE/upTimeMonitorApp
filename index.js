/*
 * Primary file for the API
 * Author: AIDEED MWANGA
 * Date: 24 - 04 - 2024
 */

//dependencies
var server = require('./lib/server');
var workers = require('./lib/workers');

//declare the app
var app = {};

app.init = ()=>{
    //start the server
    server.init();

    //start the workers\
    workers.init();
};

//execute
app.init();

//Export the app
module.exports = app;