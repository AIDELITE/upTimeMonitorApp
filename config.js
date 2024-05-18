/*
* Create and Export configuration variables
*
*/

//container for all the environments.
var environments = {};

//create stagging (default environment)
environments.staging = {
    'httpPort' : 2000,
    'httpsPort' :2001,
    'envName': 'staging',
    'hashingSecret': 'ABfCy0jn',
    'maxChecks':5,
    'twilio':{
        'accountSid':'AC6efc26a21225f3187704a5423a363b74',
        'authToken': '045814de6ba224840f5fd98463522995',
        'fromPhone': '+12178820077'
    }
};

//create the production environment
environments.production = {
    'httpPort' : 4000,
    'httpsPort' :4001,
    'envName': 'production',
    'hashingSecret': 'ABfCy0jn',
    'maxChecks':5,
    'twilio':{
        'accountSid':'AC6efc26a21225f3187704a5423a363b74',
        'authToken': '045814de6ba224840f5fd98463522995',
        'fromPhone': '+12178820077'
    }
};



//determine which environment to be exported as command line argument
var currentEnvironment = typeof(process.env.NODE_ENV) =='string'? process.env.NODE_ENV.toLowerCase() : '';

//check that the current environment is one of the environments above. else set to default(staging)

var environmentToExport = typeof(environments[currentEnvironment])=='object'? environments[currentEnvironment] : environments.staging;

//export the chosen environment
module.exports = environmentToExport;