/*
 * This are the request Handlers
 *
 */
var helpers = require('./helpers');
var _data = require('./data');
var handlers = {};

//users handler\
handlers.users = (data, callback) => {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
    // callback(200,"WE have reached here");
}

//containers for _users
handlers._users = {};

//Users post
//Required data: firstName, lastName, phone,password,tosAgreement
//optional data: none
handlers._users.post = function (data, callback) {
    //check that all required fields are filled out.
    var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        //perform action
        //make sure that the user doesn't already exist.
        _data.read('users', phone, function (err, data) {
            if (err) {
                //we are good
                //first hash the password.
                var hashedPassword = helpers.hash(password);

                //creating users object
                if (hashedPassword) {
                    var userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': true
                    }
                    _data.create('users', phone, userObject, function (err) {
                        if (!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {
                                'Error': 'Could not create the new user'
                            });
                        }
                    })
                } else {
                    callback(500, {
                        'Error': 'Could not hash the users password'
                    });
                }
            } else {
                //user already exists
                callback(400, {
                    'Error': 'A user with that phone number already Exists'
                });
            }
        })
    } else {
        callback(400, {
            'Error': 'Missing required fields'
        })
    }
}

//Users get users
//required data: phone
//optional data: none
//@TODO: Only let Authenticated user access their object. 
handlers._users.get = (data, callback) => {
    //Check that the phone provided is valid
    var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        _data.read('users', phone, function (err, data) {
            if(! err && data){
                //remove the user hashed password from the user object before returning the data
                delete data.hashedPassword;
                callback(200,data);
            }else{
                console.log(err);
                callback(404);
            }
        })
    } else {
        callback(400, {
            'Error': 'Missing Required Field'
        });
    }
}

//Users put
//Required data: phone
//Optional data: firstName, lastName, password (atleast on must be specified)
//@TODO: Only let Authenticated user update their own object.
handlers._users.put = (data, callback) => {
    //check for the required field
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    
    //check for optional fields
    var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if(phone){
        if(firstName || lastName || password){
            //lookup the user
            _data.read('users',phone, function(err,userData){
                if(!err && userData){
                    //update the required fields
                    if(firstName){userData.firstName = firstName;}
                    if(lastName){userData.lastName = lastName;}
                    if(password){userData.hashedPassword = helpers.hash(password);}
                    //now store the updates
                    _data.update('users',phone,userData,function(err){
                        if(!err){
                            callback(200); //everything was successfull
                        }else{
                            console.log(err);
                            callback(500,{'Error':'Could not update user data'});
                        }
                    })
                }else{
                    callback(400,{'Error':'The specified user does not exist'});
                }
            })
        }else{
            callback(400,{'Error':'Missing Fields to Update'});
        }

    }else{
        callback(400,{'Error':'Missing Required Fields'})
    }
}

//Users delete
//Required field: phone
//Optional fields: none
//@TODO: only let authenticated users delete their own objects. not someone else;s object
//@TODO: cleanup (delete) any data files associated with the user
handlers._users.delete = (data, callback) => {
    //Check that the phone provided is valid
    var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        _data.read('users', phone, function (err, data) {
            if(! err && data){
                _data.delete('users',phone,function(err){
                    if(! err){
                        callback(200);
                    }else{
                        callback(500, {'Error':'Could not delete users data'});
                    }
                })
            }else{
                console.log(err);
                callback(400,{'Error':'could not find specified user'});
            }
        })
    } else {
        callback(400, {
            'Error': 'Missing Required Field'
        });
    }
}


//token handlers start from here
//=======================================
//users handler\
handlers.tokens = (data, callback) => {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
    // callback(200,"WE have reached here");
}

//container for the tokens
handlers._tokens = {};

//tokens - post
//Required data: phone, password
//Optional Data: none
handlers._tokens.post = (data,callback)=>{
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if(phone && password){
        //Lookup for the user that matches the phone number
        _data.read('users',phone,function(err,userData){
            if(!err && userData){
                //Hash the sent password and compare it with the stored password in the users object
                var hashedPassword = helpers.hash(password);
                if(hashedPassword == userData.hashedPassword){
                    //if valid, create a token with a random name,set expiration date to 1 hour in the future
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + 1000 * 60 * 60;
                    var tokenObject = {
                        'phone': phone,
                        'id': tokenId,
                        'expires': expires
                    }

                    //store the token
                    _data.create('tokens',tokenId,tokenObject,function(err){
                        if(!err){
                            callback(200,tokenObject)
                        }else{
                            callback(500, {'Error': 'Could not create Token'});
                        }
                    })
                }else{
                    callback(400,{'Error':'Password Could Not Match with the Users Password stored'});
                }
            }else{
                callback(400,{'Error':'Specified User Could not be found'});
            }
        })
    }else{
        callback(400,{'Error':'Missing Required Fields'});
    }
}

//tokens - get
handlers._tokens.get = (data,callback)=>{

}

//tokens - put
handlers._tokens.put = (data,callback)=>{

}

//tokens - delete
handlers._tokens.delete = (data,callback)=>{

}


//tokens---upto here
//ping handler
handlers.ping = (data, callback) => {
    //callback a http status code and a payload
    callback(200);
}

//define the Not Found handler
handlers.notFound = (data, callback) => {
    callback(404); //this doesn't need a payload
}


module.exports = handlers;