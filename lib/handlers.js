/*
* This are the request Handlers
*
*/
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
handlers._users.post = (data,callback)=>{

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