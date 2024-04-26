/*
 * Primary file for the API
 * Author: AIDEED MWANGA
 * Date: 24 - 04 - 2024
 */
//dependencies

const http = require('http');
const url = require('url');
const stringDecoder = require('string_decoder').StringDecoder;

//the server should respond to all requests with a string
const server = http.createServer(function (req, res) {
    //Get URL and Parse it
    const parsedUrl = url.parse(req.url, true);

    //Get the path
    var path = parsedUrl.pathname; //this gets the un trimmed path that the user requested
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    //get http method
    const method = req.method.toLocaleLowerCase();

    //get headers an an object
    const headers = req.headers;

    //get the payload
    var decoder = new stringDecoder('utf-8');
    var buffer = '';

    req.on('data', function (data) {
        buffer += decoder.write(data);
    })

    req.on('end', function () {
        buffer += decoder.end();

        //chose which handler this request should go to, else go to Not found handler.
        var chosenHandler = typeof(route[trimmedPath]) !=='undefined'? route[trimmedPath]: handlers.notFound;
        

        //construct a data object that will be sent to the handler
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': buffer
        }

        //route the request specified in the handler
        chosenHandler(data,function(statusCode,payload){
            //Specify the default statusCode that will be displayed incase the handler does not return one : 200
            statusCode = typeof(statusCode) == 'number'? statusCode : 200;

            //specify the dault payload that will be displayed incase the handler does not return any.
            payload = typeof(payload) == 'object'? payload : {};

            //convert payload to string
            var payloadString = JSON.stringify(payload);

            //return the response
            res.writeHead(statusCode);
            res.end(payloadString);
            console.log("We are Returning this response: ",statusCode,payloadString);
        });

        //log the request path
    })

    //getting query string as an object
    const queryStringObject = parsedUrl.query;


    //console.log("Request is receive on path :"+trimmedPath+" with method: "+method+" with query string params:" ,queryStringObject);
})

//start the server and have it listened to a port :3000

server.listen(3000, function () {
    console.log("The server is listening to port 3000 now");
});

//defind handlers
var handlers = {};

//explan handler
handlers.explan = function(data,callback){
    //callback a http status code and a payload
    callback(406,{'name':'this is a callback payload'});
}

//define the Not Found handler
handlers.notFound = function(data,callback){
    callback(404); //this doesn't need a payload
}

//this object will define a request router
var route = {
    'explan': handlers.explan,
}