/*
 * This are the request Handlers
 *
 */
var helpers = require('./helpers');
var _data = require('./data');
var config = require('./config');
var handlers = {}; //container for handlers


/*
* //HTML HANDLERS--START
*/

handlers.index = (data,callback)=>{
    //Reject any request that isn't a get
    if(data.method=='get'){
        //Read in a template as a string
        helpers.getTemplate('index',(err,str)=>{
            if(!err && str){
                callback(200,str,'html');
            }else{
                callback(500,undefined,'html');
            }
        })
    }else{
        callback(405,undefined,'html');
    }
}

/*
* //JSON API HANDLERS--END
*/
//****************************************************************************************************
//**********_________________________BREAK______________________________****************************** */ */
/*
* //JSON API HANDLERS--START
*/

//users
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

handlers._users.get = (data, callback) => {
    //Check that the phone provided is valid
    var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        //get the token from the headers
        var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

        //verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if (tokenIsValid) {
                //proceed and perform actions
                _data.read('users', phone, function (err, data) {
                    if (!err && data) {
                        //remove the user hashed password from the user object before returning the data
                        delete data.hashedPassword;
                        callback(200, data);
                    } else {
                        console.log(err);
                        callback(404);
                    }
                })
            } else {
                callback(403, {
                    'Error': 'Missing Required token in the header or token is invalid'
                });
            }
        })
        //Lookup the user
    } else {
        callback(400, {
            'Error': 'Missing Required Field'
        });
    }
}

//Users put
//Required data: phone
//Optional data: firstName, lastName, password (atleast on must be specified)

handlers._users.put = (data, callback) => {
    //check for the required field
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

    //check for optional fields
    var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (phone) {
        if (firstName || lastName || password) {

            //get the token from the headers
            var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

            //verify that the given token is valid for the phone number
            handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
                if (tokenIsValid) {
                    //lookup the user
                    _data.read('users', phone, function (err, userData) {
                        if (!err && userData) {
                            //update the required fields
                            if (firstName) {
                                userData.firstName = firstName;
                            }
                            if (lastName) {
                                userData.lastName = lastName;
                            }
                            if (password) {
                                userData.hashedPassword = helpers.hash(password);
                            }
                            //now store the updates
                            _data.update('users', phone, userData, function (err) {
                                if (!err) {
                                    callback(200); //everything was successfull
                                } else {
                                    console.log(err);
                                    callback(500, {
                                        'Error': 'Could not update user data'
                                    });
                                }
                            })
                        } else {
                            callback(400, {
                                'Error': 'The specified user does not exist'
                            });
                        }
                    });
                } else {
                    callback(403, {
                        'Error': 'Missing Required token in the header or token is invalid'
                    });
                }
            });
        } else {
            callback(400, {
                'Error': 'Missing Fields to Update'
            });
        }

    } else {
        callback(400, {
            'Error': 'Missing Required Fields'
        })
    }
}

//Users delete
//Required field: phone
//Optional fields: none
handlers._users.delete = (data, callback) => {
    //Check that the phone provided is valid
    var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        //get the token from the headers
        var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

        //verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if (tokenIsValid) {
                _data.read('users', phone, function (err, data) {
                    if (!err && data) {
                        _data.delete('users', phone, function (err) {
                            if (!err) {
                                //delete each of the checks associated with the user
                                var userChecks = typeof (data.checks) == 'object' && data.checks instanceof Array ? data.checks : [];
                                var checksToDelete = userChecks.length;

                                if (checksToDelete > 0) {
                                    var checksDeleted = 0;
                                    var deletionErrors = false;
                                    //loop through checks
                                    userChecks.forEach((checkID) => {
                                        //delete the check
                                        _data.delete('checks', checkID, (err) => {
                                            if (err) {
                                                deletionErrors = true;
                                            }
                                            checksDeleted++;
                                            if (checksDeleted == checksToDelete) {
                                                if (!deletionErrors) {
                                                    callback(200);
                                                }else{
                                                    callback (500,{'Errors':"Errors occured while attempting delete all the user checks"});
                                                }
                                            }
                                        })
                                    });
                                } else {
                                    callback(200);
                                }
                            } else {
                                callback(500, {
                                    'Error': 'Could not delete users data'
                                });
                            }
                        })
                    } else {
                        console.log(err);
                        callback(400, {
                            'Error': 'could not find specified user'
                        });
                    }
                });
            } else {
                callback(403, {
                    'Error': 'Missing Required token in the header or token is invalid'
                });
            }
        });
    } else {
        callback(400, {
            'Error': 'Missing Required Field'
        });
    }
}


//token handlers start from here
//=======================================
//users handler
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
handlers._tokens.post = (data, callback) => {
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if (phone && password) {
        //Lookup for the user that matches the phone number
        _data.read('users', phone, function (err, userData) {
            if (!err && userData) {
                //Hash the sent password and compare it with the stored password in the users object
                var hashedPassword = helpers.hash(password);
                if (hashedPassword == userData.hashedPassword) {
                    //if valid, create a token with a random name,set expiration date to 1 hour in the future
                    var tokenId = helpers.createRandomString(20);
                    if (tokenId) {
                        var expires = Date.now() + 1000 * 60 * 60;
                        var tokenObject = {
                            'phone': phone,
                            'id': tokenId,
                            'expires': expires
                        }

                        //store the token
                        _data.create('tokens', tokenId, tokenObject, function (err) {
                            if (!err) {
                                callback(200, tokenObject)
                            } else {
                                callback(500, {
                                    'Error': 'Could not create Token'
                                });
                            }
                        })
                    } else {
                        callback(400, {
                            'Error': 'Could not generate a token'
                        });
                    }
                } else {
                    callback(400, {
                        'Error': 'Password Could Not Match with the Users Password stored'
                    });
                }
            } else {
                callback(400, {
                    'Error': 'Specified User Could not be found'
                });
            }
        })
    } else {
        callback(400, {
            'Error': 'Missing Required Fields'
        });
    }
}

//tokens - get
//Required data: id
//Optional Data: none
handlers._tokens.get = (data, callback) => {
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        _data.read('tokens', id, function (err, data) {
            if (!err && data) {
                //return the token data
                callback(200, data);
            } else {
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

//tokens - put
//Required fields: id,extend
//Optional fields: none
//Untouchable fields: phone
handlers._tokens.put = (data, callback) => {
    var id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    var extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
    if (id && extend) {
        //Lookup the token
        _data.read('tokens', id, function (err, tokenData) {
            if (!err && tokenData) {
                //check if the token time is expired
                if (tokenData.expires > Date.now()) {
                    //set the expiration an hour from now
                    tokenData.expires = Date.now() + 1000 * 60 * 60;

                    //update the data on to the memory
                    _data.update('tokens', id, tokenData, (err) => {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, {
                                'Error': 'Could not update tokens'
                            });
                        }
                    })
                } else {
                    callback(400, {
                        'Error': 'Token has already expired and cannot be extended'
                    });
                }
            } else {
                callback(400, {
                    'Error': 'Could not find specified Token'
                });
            }
        })
    } else {
        callback(400, {
            'Error': 'Missing required fields/ Invalid fields'
        });
    }
}

//tokens - delete
//required data: id
//Optional Data: none
handlers._tokens.delete = (data, callback) => {
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        _data.read('tokens', id, (err, data) => {
            if (!err && data) {
                _data.delete('tokens', id, (err) => {
                    if (!err) {
                        callback(200); //Delete successfull.
                    } else {
                        callback(500, {
                            'Error': 'Could Not delete Token'
                        });
                    }
                })
            } else {
                callback(400, {
                    'Error': 'Could not find specified token'
                });
            }
        })
    } else {
        callback(400, {
            'Error': 'Token ID is not valid'
        });
    }
}

//Verify if a given token ID is currently va;lid for a given user.
handlers._tokens.verifyToken = (id, phone, callback) => {
    //lookup the token
    _data.read('tokens', id, (err, tokenData) => {
        if (!err && tokenData) {
            //check that the token is for a given user and had not expired
            if (tokenData.phone == phone && tokenData.expires > Date.now()) {
                //Good to go
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    })
}

//token handlers end here here
//==================***********************************=====================

//checks handlers start from here
//=======================================
handlers.checks = (data, callback) => {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback);
    } else {
        callback(405);
    }
    // callback(200,"WE have reached here");
}

//container for the checks methods
handlers._checks = {};

//Checks - Post
//required data: protocol, url, method, successCodes,timeoutSeconds
//Optional data: none
handlers._checks.post = (data, callback) => {
    //validate the inputs
    var protocol = typeof (data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    var url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof (data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successCodes = typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if (protocol && url && method && successCodes && timeoutSeconds) {
        //get the token from the headers
        var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

        //lookup the user by reading the token
        _data.read('tokens', token, (err, tokenData) => {
            if (!err && tokenData) {
                var userPhone = tokenData.phone;

                //look up users data
                _data.read('users', userPhone, (err, userData) => {
                    if (!err && userData) {
                        var userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                        //verify that the user has less than the max checks per user.
                        if (userChecks.length < config.maxChecks) {
                            //Create a random iD for the check.
                            var checkId = helpers.createRandomString(20);

                            //Create the check object and include the users number
                            var checkObject = {
                                "id": checkId,
                                "userPhone": userPhone,
                                "protocol": protocol,
                                "url": url,
                                "method": method,
                                "successCodes": successCodes,
                                "timeoutSeconds": timeoutSeconds
                            }
                            //write the data
                            _data.create('checks', checkId, checkObject, (err) => {
                                if (!err) {
                                    //add the check id to users object.
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);

                                    //save the new user data
                                    _data.update('users', userPhone, userData, (err) => {
                                        if (!err) {
                                            callback(200, checkObject);
                                        } else {
                                            callback(500, {
                                                'Error': 'Could update users data with new check'
                                            });
                                        }
                                    })
                                } else {
                                    callback(500, {
                                        'Error': 'Could not create the new check'
                                    });
                                }
                            })
                        } else {
                            callback(400, {
                                'Error': 'THe user already has the maximum number of Check, remove some'
                            });
                        }
                    } else {
                        callback(403);
                    }
                })
            } else {
                callback(403);
            }
        });
    } else {
        callback(400, {
            'Error': 'Missing required inputs or Invalid inputs'
        });
    }
}

//Checks - get
//required data: id
//Optional data: none

handlers._checks.get = (data, callback) => {
    //Check that the id provided is valid
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        //lookup the check
        _data.read('checks', id, (err, checksData) => {
            console.log(checksData);
            if (!err && checksData) {
                //get the token from the headers
                var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

                //verify that the given token is valid for the phone number
                handlers._tokens.verifyToken(token, checksData.userPhone, (tokenIsValid) => {
                    if (tokenIsValid) {
                        //return checksData
                        callback(200, checksData);
                    } else {
                        callback(403, {
                            'Error': 'Missing Required token in the header or token is invalid'
                        });
                    }
                });
            } else {
                console.log(err);
                callback(404);
            }
        })
        //Lookup the user
    } else {
        callback(400, {
            'Error': 'Missing Required Field'
        });
    }
}

//Checks - put
//required data: id
//Optional data: protocol,url,methods, successCodes, timeoutSeconds (one must be sent)
handlers._checks.put = (data, callback) => {
    //check for the required field
    var id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;

    //check for optional fields
    var protocol = typeof (data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    var url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof (data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successCodes = typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    //check to make sure that ID is valid
    if (id) {
        //check to make sure 1 or more optional fields is sent
        if (protocol || url || method || successCodes || timeoutSeconds) {
            //lookup the checks
            _data.read('checks', id, (err, checkData) => {
                if (!err && checkData) {
                    //get the token from the headers
                    var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

                    //verify that the given token is valid for the phone number
                    handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
                        if (tokenIsValid) {
                            //update the checkData object where neccessary
                            if (protocol) {
                                checkData.protocol = protocol;
                            }
                            if (url) {
                                checkData.url = url;
                            }
                            if (method) {
                                checkData.method = method;
                            }
                            if (successCodes) {
                                checkData.successCodes = successCodes;
                            }
                            if (timeoutSeconds) {
                                checkData.timeoutSeconds = timeoutSeconds;
                            }

                            //write data to the disk
                            _data.update('checks', id, checkData, (err) => {
                                if (!err) {
                                    callback(200);
                                } else {
                                    callback(500, {
                                        'Error': 'Could not update the checks'
                                    });
                                }
                            })
                        } else {
                            callback(403);
                        }
                    });
                } else {
                    callback(400, {
                        'Error': 'Check ID did not exist'
                    });
                }
            })
        } else {
            callback(400, {
                'Error': 'Missing fields to update'
            });
        }
    } else {
        callback(400, {
            'Error': 'Missing required field'
        });
    }
}

//Checks - delete
//required data: id
//Optional data: none

handlers._checks.delete = (data, callback) => {
    //Check that the phone provided is valid
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        //lookup the check
        _data.read('checks', id, (err, checksData) => {
            if (!err && checksData) {
                //get the token from the headers
                var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

                //verify that the given token is valid for the phone number
                handlers._tokens.verifyToken(token, checksData.userPhone, (tokenIsValid) => {
                    if (tokenIsValid) {
                        //delete check data

                        _data.delete('checks', id, (err) => {
                            if (!err) {
                                _data.read('users', checksData.userPhone, function (err, usersdata) {
                                    if (!err && usersdata) {
                                        var userChecks = typeof (usersdata.checks) == 'object' && usersdata.checks instanceof Array ? usersdata.checks : [];

                                        //remove the deleted check from the list of checks
                                        var checkPosition = userChecks.indexOf(id);
                                        if (checkPosition > -1) {
                                            userChecks.splice(checkPosition, 1);
                                            //resave the users data
                                            _data.update('users', checksData.userPhone, usersdata, function (err) {
                                                if (!err) {
                                                    callback(200);
                                                } else {
                                                    console.log(err);
                                                    callback(500, {
                                                        'Error': 'Could not update the user'
                                                    });
                                                }
                                            });
                                        } else {
                                            callback(500, {
                                                "Error": 'Could not find the check on the users object, so could not remove from the list'
                                            });
                                        }
                                    } else {
                                        console.log(err);
                                        callback(500, {
                                            'Error': 'could not find specified user who created the check, so could not remove the checks'
                                        });
                                    }
                                });
                            } else {
                                callback(500, {
                                    'error': 'Could not delete the check data'
                                });
                            }
                        });
                    } else {
                        callback(403, {
                            "error": "Token Verification wasn't successfull"
                        });
                    }
                });
            } else {
                callback(400, {
                    'error': 'Specified check ID does not exist'
                });
            }
        });

    } else {
        callback(400, {
            'Error': 'Missing Required Field'
        });
    }
}

//checks handlers end here
//=================**********************************======================

//ping handler
handlers.ping = (data, callback) => {
    //callback a http status code and a payload
    callback(200);
}

//define the Not Found handler
handlers.notFound = (data, callback) => {
    callback(404); //this doesn't need a payload
}

/*
* //JSON API HANDLERS--END
*/


module.exports = handlers;