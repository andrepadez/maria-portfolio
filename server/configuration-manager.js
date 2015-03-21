var fs = require('fs');

var projects = require('../projects.json');

module.exports = {
	getAllConfiguration: function(){
		return configObject;
	}
};

var configObject = {
    projects: projects
};
