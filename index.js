/*
* primary file for the API
*
*/
//dependencies

const http = require('http');

//the server should respond to all requests with a string
const server = http.createServer(function(req,res){
    res.end("Hello there");
})

//start the server and have it listened to a port :3000

server.listen(3000, function(req,res){

})