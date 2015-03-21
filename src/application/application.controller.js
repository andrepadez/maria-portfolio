var pubsub = require('organic-lib/pubsub');
var view = require('./application.view');
var projectsList = require('./projects-list/projects-list.controller');

var Application = function(){};
Application.prototype.constructor = Application;
var application = module.exports = new Application();

Application.prototype.init = function(config, wrapper){
	this.$config = config || {};
    this.$wrapper = wrapper || document.body;
    return view.init(this)
        .then( projectsList.init.bind(projectsList, this, this.$config.projects) );
};

Application.prototype.broadcast = function(message, data){
    pubsub.broadcast(message, data);
};
