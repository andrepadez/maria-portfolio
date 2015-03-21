var templator = require('organic-lib/templator');

var $scope;

var ProjectsListView = function(){};
ProjectsListView.prototype.constructor = ProjectsListView;
var projectsListView = module.exports = new ProjectsListView();

ProjectsListView.prototype.init = function(controller){
    $scope = controller; console.log($scope.$config);
    //returns the promise created in templator.render
    return this.render($scope.$wrapper, $scope.$config)
        .then( registerDOM )
        .then( registerBehaviour );
};

//we expose the render method because there may come the need for the controller to render it again
ProjectsListView.prototype.render = function(wrapper, locals){
    //use the templator to render the html
    return templator.render('projects-list.html', locals, wrapper);
};

//we cache all the DOM elements we'll use later
var registerDOM = function(){
    $scope.$DOM = {
    };
};

var registerBehaviour = function(){
    $scope.$wrapper.addEventListener('click', function(ev){
        var target = ev.target;
        if(target.dataset.project){
            ev.preventDefault();
            $scope.broadcast('project changed', { slug: target.dataset.project });
        }
    });
};
