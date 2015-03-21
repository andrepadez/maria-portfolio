var templator = require('organic-lib/templator');

var $scope;

var ApplicationView = function(){};
ApplicationView.prototype.constructor = ApplicationView;
var applicationView = module.exports = new ApplicationView();

ApplicationView.prototype.init = function(controller){
    $scope = controller;
    //returns the promise created in templator.render
    return this.render($scope.$wrapper, $scope.$config)
        .then( registerDOM )
        .then( registerBehaviour );
};

//we expose the render method because there may come the need for the controller to render it again
ApplicationView.prototype.render = function(wrapper, locals){
    //use the templator to render the html
    return templator.render('main.html', locals, wrapper);
};

//we cache all the DOM elements we'll use later
var registerDOM = function(){
    $scope.$DOM = {

    };
};

var registerBehaviour = function(){
    
};
