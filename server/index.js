var path = require('path')
  , express = require('express')
  , serveStatic = require('serve-static')
  , configManager = require('./configuration-manager');

var app = express();
app.set('port', (process.env.PORT || 3001));
app.use( serveStatic( path.join( __dirname, '../dist/prod') ) );

app.listen( app.get('port'), function(){
	console.log('listening on port ', app.get('port'));
});

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	next();
 });

app.get('/get-configuration', function(req, res){
	var configurationData = configManager.getAllConfiguration();
	res.send(configurationData);
});