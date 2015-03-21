var pubsub = require('organic-lib/pubsub');
var view = require('./application.view');

var Application = function(){};
Application.prototype.constructor = Application;
var application = module.exports = new Application();

Application.prototype.init = function(config, wrapper){
	this.$config = config || {};
    this.$wrapper = wrapper || document.body;
    return view.init(this);
};

Application.prototype.broadcast = function(message, data){
    pubsub.broadcast(message, data);
};
