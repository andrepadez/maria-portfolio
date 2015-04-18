var fs = require('fs');

var configObject = require('../projects.json');

module.exports = {
	getAllConfiguration: function(){
		return configObject;
	}
};