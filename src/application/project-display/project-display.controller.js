var pubsub = require('organic-lib/pubsub');
var view = require('./project-display.view');

var ProjectDisplay = function(){};
ProjectDisplay.prototype.constructor = ProjectDisplay;
var projectDisplay = module.exports = new ProjectDisplay();

ProjectDisplay.prototype.init = function(parentScope, config, wrapper){
    this.$parentScope = parentScope;
    this.$config = config || {};
    this.$wrapper = wrapper || this.$parentScope.$DOM.projectContainer;
    registerNotificationInterests();
    return view.init(this);
};

var registerNotificationInterests = function(){
    var notificationInterests = [
        'project changed'
    ];

    pubsub.subscribe(notificationInterests, notificationHandler);
};

var notificationHandler = function(message, payload){
    switch(message){
        case 'project changed':
            view.renderProject( payload.project );
            break;
    }
};
