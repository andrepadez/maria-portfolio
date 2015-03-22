var pubsub = require('organic-lib/pubsub');
var view = require('./application.view');
var projectsList = require('./projects-list/projects-list.controller');
var projectDisplay = require('./project-display/project-display.controller');

var Application = function(){};
Application.prototype.constructor = Application;
var application = module.exports = new Application();

Application.prototype.init = function(config, wrapper){
	this.$config = config || {};
    this.$wrapper = wrapper || document.body;
    return view.init(this)
        .then( projectsList.init.bind(projectsList, this, this.$config.projects) )
        .then( projectDisplay.init.bind(projectsList, this) )
        .then( view.renderPage.bind(view, 'about') );
};

Application.prototype.hashChanged = function(hash){
    var path = ( hash || window.location.hash ).replace('#/', '').split('/');
    var action = path.shift();

    switch( action ){
        case 'about':
        case 'contact':
            view.renderPage( action );
            break;
        case 'project':
            projectsList.changeProject( path.shift() );
            break;
    }
};
