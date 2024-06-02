/*
/server related files
*/

//dependencies

const http = require('http');
const https = require('https');
const url = require('url');
const stringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');
var handlers = require('./handlers');
var helpers = require('./helpers');
var path = require('path');
var utl = require('util');
var debug = utl.debuglog('server');

//instanstiate the server module object
var server = {};
//create http server
server.httpServer = http.createServer(function (req, res) {
    server.unifiedServer(req,res);
});

//create Https server
server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
};
server.httpsServer = https.createServer(server.httpsServerOptions,function (req, res) {
    server.unifiedServer(req,res);
});

//all the server logic for the http and https
server.unifiedServer = function(req, res){
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
        var chosenHandler = typeof(server.route[trimmedPath]) !=='undefined'? server.route[trimmedPath]: handlers.notFound;
        
        //if the request is within the public directory, use the public handler instead
        chosenHandler = trimmedPath.indexOf('public/') >-1 ? handlers.public: chosenHandler;
        //construct a data object that will be sent to the handler
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        }

        //route the request specified in the handler
        chosenHandler(data,function(statusCode,payload,contentType){
            //Determine the type of response (fallback to json)
            contentType = typeof(contentType)=='string'? contentType: 'json';
            //Specify the default statusCode that will be displayed incase the handler does not return one : 200
            statusCode = typeof(statusCode) == 'number'? statusCode : 200;

            //return the response part that are content specific
            var payloadString = '';
            if(contentType=='json'){
                res.setHeader('Content-Type','application/json');
                payload = typeof(payload) == 'object'? payload : {};
                payloadString = JSON.stringify(payload);
            }
            if(contentType=='html'){
                res.setHeader('Content-Type','text/html');
                payloadString = typeof(payload)=='string'? payload: '';
            }
            if(contentType=='favicon'){
                res.setHeader('Content-Type','image/x-icon');
                payloadString = typeof(payload) !=='undefined'? payload: '';
            }
            if(contentType=='css'){
                res.setHeader('Content-Type','text/css');
                payloadString = typeof(payload)!=='undefined'? payload: '';
            }
            if(contentType=='png'){
                res.setHeader('Content-Type','image/png');
                payloadString = typeof(payload)!=='undefined'? payload: '';
            }
            if(contentType=='jpg'){
                res.setHeader('Content-Type','image/jpeg');
                payloadString = typeof(payload)!=='undefined'? payload: '';
            }
            if(contentType=='plain'){
                res.setHeader('Content-Type','text/plain');
                payloadString = typeof(payload)!=='undefined'? payload: '';
            }
            //Return the response-parts that are common to all content-types
            res.writeHead(statusCode);
            res.end(payloadString);

            //if the response is 200, print green otherwise orint red
            if(statusCode==200){
                debug('\x1b[32m%s\x1b[0m',method.toUpperCase()+'/'+trimmedPath+' '+statusCode);
            }else{
                debug('\x1b[31m%s\x1b[0m',method.toUpperCase()+'/'+trimmedPath+' '+statusCode);
            }
        });

        //log the request path
    })

}

//this object will define a request router
server.route = {
    '': handlers.index,
    'account/create': handlers.accountCreate,
    'account/edit': handlers.accountEdit,
    'account/deleted': handlers.accountDeleted,
    'session/create': handlers.sessionCreate,
    'session/deleted': handlers.sessionDeleted,
    'checks/all': handlers.checksList,
    'checks/create': handlers.checksCreate,
    'checks/edit': handlers.checksEdit,
    'ping': handlers.ping,
    'api/users': handlers.users,
    'api/tokens': handlers.tokens,
    'api/checks': handlers.checks,
    'favicon.ico' : handlers.favicon,
    'public' : handlers.public
}

//the init script
server.init = ()=>{
    //start the HTTP server
    server.httpServer.listen(config.httpPort, function () {
        console.log('\x1b[35m%s\x1b[0m',`The Http server is listening to port ${config.httpPort} now`);
    });

    //start the https server
    server.httpsServer.listen(config.httpsPort, function () {
        console.log('\x1b[36m%s\x1b[0m',`The Https server is listening to port ${config.httpsPort} now`);
    });
}

//export the whole server
module.exports = server;