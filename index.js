/*
 * Primary file for the API
 * Author: AIDEED MWANGA
 * Date: 24 - 04 - 2024
 */
//dependencies

const http = require('http');
const https = require('https');
const url = require('url');
const stringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');
var handlers = require('./lib/handlers');
var helpers = require('./lib/helpers');


//create http server
const httpServer = http.createServer(function (req, res) {
    unifiedServer(req,res);
});

//create Https server
var httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};
const httpsServer = https.createServer(httpsServerOptions,function (req, res) {
    unifiedServer(req,res);
})

//Instantiating the http server
httpServer.listen(config.httpPort, function () {
    console.log(`The Http server is listening to port ${config.httpPort} now`);
});


//Instantiating the http server
httpsServer.listen(config.httpsPort, function () {
    console.log(`The Https server is listening to port ${config.httpsPort} now`);
});

//all the server logic for the http and https
const unifiedServer = function(req, res){
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

    //getting query string as an object
    const queryStringObject = parsedUrl.query;

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
            'payload': helpers.parseJsonToObject(buffer)
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
            res.setHeader('Content-Type','application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
            console.log("We are Returning this response: ",statusCode,payloadString);
        });

        //log the request path
    })

}

//this object will define a request router
var route = {
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens': handlers.tokens,
    'checks': handlers.checks,
    
}