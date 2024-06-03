/*
** javascript files are going to go here
**
*/
//this is the container for the frontend
var app = {};

//config
app.config = {
    'sessionToken': false
}

//AJAX client for the restful API
app.client = {};

app.client.request = (headers,path,method,queryStringObject,payload,callback)=>{
    headers = typeof(headers)=='object' && headers !==null? headers: {};
    path = typeof(path)=='string'? path : '/';
    method = typeof(method)=='string' && ['POST','GET','PUT','DELETE'].indexOf(method) >-1? method.toUpperCase() : 'GET';
    queryStringObject = typeof(queryStringObject)=='object' && queryStringObject !==null? queryStringObject : {};
    payload = typeof(payload)=='object' && payload !==null? payload : {};
    callback = typeof(callback)=='function'? callback: false;

    //for each queryparameter sent, add it to path
    var requestUrl = path+'?';
    var counter = 0;
    for(var queryKey in queryStringObject){
        if(queryStringObject.hasOwnProperty(queryKey)){
            counter++;
            //if atleast one query string parameter has already been added, prepend new ones with an Ampersand
            if(counter > 1){
                requestUrl += '&';
            }
            // add key and value
            requestUrl+= queryKey+"="+queryStringObject[queryKey];
        }
    }
    //for the http request as a json object
    var xhr = new XMLHttpRequest();
    xhr.open(method,requestUrl,true);
    xhr.setRequestHeader('Content-Type','application/json');

    //for each header sent, add it to the request
    for(var headerKey in headers){
        if(headers.hasOwnProperty(headerKey)){
            xhr.setRequestHeader(headerKey,headers[headerKey]);
        }
    }

    //if there is a current session token set, add that as a header
    if(app.config.sessionToken){
        xhr.setRequestHeader('token',app.config.sessionToken.id);
    }

    //when request comes back, handle the request
    xhr.onreadystatechange = ()=>{
        if(xhr.readyState==XMLHttpRequest.DONE){
            var statusCode = xhr.status;
            var responseReturned = xhr.responseText;

            //callback if requested
            if(callback){
                try {
                    var parsedResponse = JSON.parse(responseReturned);
                    callback(statusCode,parsedResponse);
                } catch (error) {
                    callback(statusCode,false);
                }
            }
        }
    }

    //send the payload string
    var payloadString = JSON.stringify(payload);
    xhr.send(payloadString);
}

//bind the forms
app.bindForms = ()=>{
    document.querySelector('form').addEventListener('submit',(e)=>{
        //stop submission
        e.preventDefault();
        var formID = this.id;
        var path = this.action;
        var method = this.method.toUpperCase();

        //hide the error message (If it was previously displayed)
        document.querySelector("#"+formID+" .formError").style.display='hidden';

        //turn inputs into payload
        var payload = {};
        var elements = this.elements;
        for(var i=0; i < elements.length; i++){
            if(elements[i].type !== 'submit'){
                var valueOfElement = elements[i].type == 'checkbox' ? elements[i].checked : elements[i].value;
                payload[elements[i].name] = valueOfElement;
            }
        }
    });
}