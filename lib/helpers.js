/*
 * Library for storing helper functions for various tasks
 *
 */

//dependencies
var crypto = require('crypto');
var config = require('./config');
var http = require('http');
var querystring = require('querystring');
var path = require('path');
var fs = require('fs');

//declare a container for the helper functions

var helpers = {};
//hash function
helpers.hash = (str) => {
    //validate the incoming string
    if (typeof (str) == 'string' && str.length > 0) {
        var hash = crypto
            .createHmac('sha256', config.hashingSecret)
            .update(str)
            .digest('hex');
        return hash;
    } else {
        return false;
    }

}

//function to parse json to object
helpers.parseJsonToObject = (str) => {
    try {
        var obj = JSON.parse(str);
        return obj;
    } catch (error) {
        return {};
    }
}

//function for creating random Alphnumeric characters of defined length
helpers.createRandomString = (strLength) => {
    var strLength = typeof (strLength) == 'number' && strLength > 0 ? strLength : false;
    if (strLength) {
        //define charaters
        var characterSet = "abcdefghijklmnopqrstuvwxyz0123456789";
        var str = "";
        for (x = 1; x <= strLength; x++) {
            //get random characters from character set
            str += characterSet.charAt(Math.floor(Math.random() * characterSet.length));
        }
        return str;
    } else {
        return false;
    }
}

//send an SMS message via twilio
// helpers.sendTwilioSMS = function(phone,message,callback){
//     //validate parameters.
//     phone = typeof(phone)=='string' && phone.trim().length==10? phone.trim() : false;
//     message = typeof(message)=='string' && message.trim().length>0 && message.trim().length<=1600 ? message.trim() : false;

//     if(phone && message){
//         //configure the request payload.
//         var payload = {
//             'From': config.twilio.fromPhone,
//             'To': '+1'+phone,
//             'body': message
//         }

//         //stringfy the payload
//         var stringPayload = querystring.stringify(payload);
//         //configure the request details.
//         var requestDetails = {
//             'protocol' : 'https:',
//             'host' : 'api.twilio.com',
//             'method': 'POST',
//             'path': '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
//             'auth': config.twilio.accountSid+':'+config.twilio.authToken,
//             'headers':{
//                 'Content-Type': 'application/x-www-form-urlencoded',
//                 'Content-Length': Buffer.byteLength(stringPayload)
//             }
//         }

//         //instantiate the request object
//         var req = https.request(requestDetails,(res)=>{
//             //grab the status of the sent request
//             var status = res.statusCode;
//             //callback
//             if(status==200 || status==201){
//                 callback(false);
//             }else{
//                 callback('Status code returned was '+status);
//             }
//         })

//         //bind to an error event so it doesn't get thrown
//         req.on('error',(e)=>{
//             callback(e);
//         });

//         //Add payload
//         req.write(stringPayload);

//         //End the request
//         req.end();

//     }else{
//         callback("Given parameters were missing or Invalid");
//     }

// }

//send message via AFricas Talking
helpers.sendSMSTOUSER = (phone, message, callback) => {
    phone = typeof (phone) == 'string' && phone.trim().length == 10 && phone.trim().startsWith('0') ? phone.trim() : false;
    message = typeof (message) == 'string' && message.trim().length > 0 && message.trim().length <= 1600 ? message.trim() : false;

    if (phone && message) {
        var phonenumber = "256" + phone.substring(1);
        var dataObject = JSON.stringify({
            "phoneContact": phonenumber,
            "msg": message
        });

        // Define the options for the HTTP request
        const options = {
            hostname: 'localhost', // Replace with the actual API hostname
            port: 2100, // Replace with the appropriate port, usually 80 or 443
            path: '/sendMsg', // Replace with the actual API endpoint path
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(dataObject)
            }
        };

        // Create the HTTP request
        const req = http.request(options, (res) => {
            let data = '';

            // Set the encoding of the response data
            res.setEncoding('utf8');

            // Collect the response data
            res.on('data', (chunk) => {
                data += chunk;
            });

            // Handle the end of the response
            res.on('end', () => {
                callback(false, data);
            });
        });

        // Handle request errors
        req.on('error', (e) => {
            callback(true, `Problem with request: ${e.message}`);
        });

        // Write data to request body
        req.write(dataObject);
        // End the request
        req.end();
    } else {
        callback(true, "One of the sent parameters is invalid");
    }
}


//get the string content of a template
helpers.getTemplate =(templateName,callback)=>{
    templateName = typeof(templateName)=='string' && templateName.length>0 ? templateName: false;
    if(templateName){
        var templateDir = path.join(__dirname,'/../templates/');
        fs.readFile(templateDir+templateName+".html",'utf8',(err,str)=>{
            if(!err && str && str.length>0){
                callback(false,str);
            }else{
                callback('No Template could be found');
            }
        })
    }else{
        callback("A Valid templatewas not specified");
    }
}

//Take a given string and data object and find /replace all the keys within it
helpers.interpolate = (str,data)=>{
    
}
module.exports = helpers;