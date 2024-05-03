/*
* This are the request Handlers
*
*/
var helpers = require('./helpers');
var _data = require('./data');
var handlers = {};

//users handler\
handlers.users = (data,callback)=>{
    var acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1)
    {
        handlers._users[data.method](data,callback);
    }else{
        callback(405);
    }
}

//containers for _users
handlers._users = {};

//Users post
//Required data: firstName, lastName, phone,password,tosAgreement
//optional data: none
handlers._users.post = (data,callback)=>{
//check that all required fields are filled out.
    var firstName = typeof(data.payload.firstName)=='string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim():false;
    var lastName = typeof(data.payload.lastName)=='string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim():false;
    var phone = typeof(data.payload.phone)=='string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim():false;
    var password = typeof(data.payload.password)=='string' && data.payload.password.trim().length > 0 ? data.payload.password.trim():false;
    var tosAgreement = typeof(data.payload.tosAgreement)=='boolean' && data.payload.tosAgreement.trim().length == true ? true : false;
    
    if(firstName && lastName && phone && password && tosAgreement){
        //perform action
        //make sure that the user doesn't already exist.
        _data.read('users',phone,function(err,data){
            if(err){
                //we are good
                //first hash the password.
                var hashedPassword = helpers.hash(password);

                //creating users object
                var userObject = {
                    'firstName':firstName,
                    'lastName': lastName,
                    'phone':phone,
                    'hashedPassword':hashedPassword,
                    'tosAgreement': true
                }
                
            }else{
                //user already exists
                callback(400,{'Error':'A user with that phone number already Exists'});
            }
        })
    }else{
        callback(400,{'Error':'Missing required fields'})
    }
}

//Users get
handlers._users.get = (data,callback)=>{
    
}

//Users put
handlers._users.update = (data,callback)=>{
    
}

//Users delete
handlers._users.post = (data,callback)=>{
    
}
//ping handler
handlers.ping = (data,callback)=>{
    //callback a http status code and a payload
    callback(200);
}

//define the Not Found handler
handlers.notFound = (data,callback)=>{
    callback(404); //this doesn't need a payload
}


module.exports = handlers;