/*
 * Library for storing helper functions for various tasks
 *
 */

//dependencies
var crypto = require('crypto');
var config = require('./../config');
var https = require('https');
var querystring = require('querystring');

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
    var strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
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
helpers.sendTwilioSMS = function(phone,message,callback){
    //validate parameters.
    phone = typeof(phone)=='string' && phone.trim().length==10? phone.trim() : false;
    message = typeof(message)=='string' && message.trim().length>0 && message.trim().length<=1600 ? message.trim() : false;

    if(phone && message){
        //configure the request payload.
        var payload = {
            'From': config.twilio.fromPhone,
            'To': '+1'+phone,
            'body': message
        }

        //stringfy the payload
        var stringPayload = querystring.stringify(payload);
        //configure the request details.
        var requestDetails = {
            'protocol' : 'https:',
            'host' : 'api.twilio.com',
            'method': 'POST',
            'path': '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
            'auth': config.twilio.accountSid+':'+config.twilio.authToken,
            'headers':{
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        }

        //instantiate the request object
        var req = https.request(requestDetails,(res)=>{
            //grab the status of the sent request
            var status = res.statusCode;
            //callback
            if(status==200 || status==201){
                callback(false);
            }else{
                callback('Status code returned was '+status);
            }
        })

        //bind to an error event so it doesn't get thrown
        req.on('error',(e)=>{
            callback(e);
        });

        //Add payload
        req.write(stringPayload);

        //End the request
        req.end();

    }else{
        callback("Given parameters were missing or Invalid");
    }

}
module.exports = helpers;