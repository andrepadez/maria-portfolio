var pubsub = require('organic-lib/pubsub');
var view = require('./projects-list.view');

var ProjectsList = function(){};
ProjectsList.prototype.constructor = ProjectsList;
var projectsList = module.exports = new ProjectsList();

ProjectsList.prototype.init = function(parentScope, config, wrapper){
    this.$parentScope = parentScope;
    this.$config = config || {};
    this.projects = config.projects;
    this.$wrapper = wrapper || this.$parentScope.$DOM.projectsList;
    return view.init(this);
};

ProjectsList.prototype.broadcast = function(message, data){
    pubsub.broadcast(message, data);
};
