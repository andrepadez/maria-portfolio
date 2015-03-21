var templator = require('organic-lib/templator');

var $scope;

var ProjectDisplayView = function(){};
ProjectDisplayView.prototype.constructor = ProjectDisplayView;
var projectDisplayView = module.exports = new ProjectDisplayView();

ProjectDisplayView.prototype.init = function(controller){
    $scope = controller;

};

//we expose the render method because there may come the need for the controller to render it again
ProjectDisplayView.prototype.renderProject = function(project){
    var locals = {
        project: project
    };
    return templator.empty($scope.$wrapper)
        .then( templator.render.bind(templator, 'project-display.html', locals, $scope.$wrapper) );
};

//we cache all the DOM elements we'll use later
var registerDOM = function(){
    $scope.$DOM = {
    };
};

var registerBehaviour = function(){
    
};
