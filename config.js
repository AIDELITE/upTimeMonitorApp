/*
* Create and Export configuration variables
*
*/

//container for all the environments.
var environments = {};

//create stagging (default environment)
environments.staging = {
    'port' : 2000,
    'envName': 'staging'
};

//create the production environment
environments.production = {
    'port' : 4000,
    'envName': 'production'
};


//determine which environment to be exported as command line argument
var currentEnvironment = typeof(process.env.NODE_ENV) =='string'? process.env.NODE_ENV.toLowerCase() : '';

//check that the current environment is one of the environments above. else set to default(staging)

var environmentToExport = typeof(environments[currentEnvironment])=='object'? environments[currentEnvironment] : environments.staging;

//export the chosen environment
module.exports = environmentToExport;