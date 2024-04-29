/*
* This are the request Handlers
*
*/
var handlers = {};

//ping handler
handlers.ping = function(data,callback){
    //callback a http status code and a payload
    callback(200);
}

//define the Not Found handler
handlers.notFound = function(data,callback){
    callback(404); //this doesn't need a payload
}


module.exports = handlers;