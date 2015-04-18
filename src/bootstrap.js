var pubsub = require('organic-lib/pubsub');
var ajax = require('organic-lib/ajax');
var application = require('./application/application.controller');

var isDevelopment = ~window.location.host.indexOf('localhost');

window.hostName = isDevelopment? 'http://localhost:3001' : '//' + window.hostName;
var CONFIGURATION_URL = window.hostName + '/get-configuration';


ajax.getJSON( CONFIGURATION_URL )
	.then( application.init.bind(application) )
    .then( function(){
        var hash = window.location.hash || 'about';
        application.hashChanged(hash);
    })
	.then (
		function(){ console.log('application started successfully'); },
		function(err){ console.error(err.stack); }
	);


pubsub.subscribe('*', function(message, payload){
	console.log('------- Message Received ----------');
	console.log('message:', message);
	console.log('payload:', payload);
    console.log('-----------------------------------');
});
