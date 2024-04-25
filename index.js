/*
* Primary file for the API
* Author: AIDEED MWANGA
* Date: 24 - 04 - 2024
*/
//dependencies

const http = require('http');
const url = require('url');

//the server should respond to all requests with a string
const server = http.createServer(function(req,res){
    res.end("<h1>Hello there</h1>");
})

//start the server and have it listened to a port :3000

server.listen(3000, function(){
    console.log("The server is listening to port 3000 now");
})