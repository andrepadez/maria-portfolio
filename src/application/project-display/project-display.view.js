var templator = require('organic-lib/templator');

var $scope;

var ProjectDisplayView = function(){};
ProjectDisplayView.prototype.constructor = ProjectDisplayView;
var projectDisplayView = module.exports = new ProjectDisplayView();

ProjectDisplayView.prototype.init = function(controller){
    $scope = controller;
    registerDOM();
    registerBehaviour();

};

//we expose the render method because there may come the need for the controller to render it again
ProjectDisplayView.prototype.renderProject = function(project){
    var locals = {
        project: project
    };
    var templateURL = project.title !== 'A Monument to Uncle Nelson'? 
      'project-display.html': 'project-display-nelson.html';

    return templator.empty($scope.$wrapper)
        .then( templator.render.bind(templator, templateURL, locals, $scope.$wrapper) )
        .then( registerDOM )
        .then( changeSlide.bind(null, 1) );
};

//we cache all the DOM elements we'll use later
var registerDOM = function(){
    $scope.$DOM = {
      slides: Array.prototype.slice.call( $scope.$wrapper.querySelectorAll('.slide') )
    };
};

var registerBehaviour = function(){
    $scope.$wrapper.addEventListener('click', wrapperClickHandler);
};

var wrapperClickHandler = function(ev){
  var elem = ev.target;
  if(elem.dataset.slide){
    ev.preventDefault();
    changeSlide(elem.dataset.slide);
  }
};

var changeSlide = function(index){console.log('changing slide', index);
  $scope.$DOM.slides.forEach(function(slide){
      if(index == slide.dataset.index){
          slide.classList.remove('hidden');
      } else {
          slide.classList.add('hidden');
      }
  });
};
