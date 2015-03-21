var fs = require('fs');

module.exports = {
	getAllConfiguration: function(){
		return configObject;
	}
};

var configObject = {};
