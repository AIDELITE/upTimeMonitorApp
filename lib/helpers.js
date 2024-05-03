/*
* Library for storing helper functions for various tasks
*
*/

//dependencies
var crypto = require('crypto');
var config = require('./../config');

//declare a container for the helper functions

var helpers = {};
//hash function
helpers.hash = (str) =>{
    //validate the incoming string
    if(typeof(str)=='string' && str.length >0)
    {
        var hash = crypto.createHmac('sha256',config.hashingSecret).update(str).digest('hex');
        return hash;
    }else{
        return false;
    }

}

//function to parse json to object
helpers.parseJsonToObject = (str)=>{
    try {
        var obj = JSON.parse(str);
        return obj;
    } catch (error) {
        return {};
    }
}

module.exports = helpers;