# Maria Portfolio

## Requirements
* node.js + NPM 
* grunt - npm install -g grunt-cli
* ruby compass - gem install compass
* nodemon - npm install -g nodemon

## Automation
* Grunt for automation
* browserify for commonjs style require and module.exports
* sass compiling
* BrowserSync and grunt-watch for serving and live-reload (with re-compilation)
* testem framework with Mocha and Chai  
* includes organic-lib with basic tools to help you develop

## Usage

### installation
```
git clone git@github.com:andrepadez/maria-portfolio
cd maria-portfolio
npm install
```
run development server
```
grunt dev
```
### developing

All the module logic goes into the src/ folder  
if you want to add specific CSS to the module start in src/css/main.scss  
all the views, including sub-module's views, should be in src/views  
##### use src/bootstrap.js to bootstrap the module 

#### there's a controller and view:
###### src/new-module/new-module.controller.js
responsible for any communication to the outside world  manages the view and passes itself as a $scope to the view on initiation  
only communicates through messages, knows nothing about outside scope
```javascript
var pubsub = require('organic-lib/pubsub');
var view = require('./module-name.view');

var NewModule = function(){};
NewModule.prototype.constructor = NewModule;
var newModule = module.exports = new NewModule();

NewModule.prototype.init = function(config, wrapper){
    //wrapper refers to the DOM element where the component is going to be rendered
    this.$wrapper = wrapper || document.body;
    this.$config = config;

    //some initialization logic here
    
    //returns the promise created in templator.render()
    return view.init(this);
};

NewModule.prototype.broadcast = function(message, data){
    pubsub.broadcast(message, data);
};
```
###### src/module-name/module-name.view.js
knows nothing of the outside world, only knows of the controller as $scope  
sends messages to the controller, when some action takes place  

```javascript
var templator = require('oet-lib/templator');
var $scope;

var NewModuleView = function(){};
NewModuleView.prototype.constructor = NewModuleView;
var newModuleView = module.exports = new NewModuleView();

NewModuleView.prototype.init = function(controller){
    $scope = controller;
    //returns the promise created in templator.render
    return this.render($scope.$wrapper, $scope.tabs)
        .then(registerDom)
        .then(registerEvents)
        .then(...);
};

//we expose the render method because there may come the need for the controller to render it again
NewModuleView.prototype.render = function(){
    //use the templator to render the html
    return templator.render('views/module-name/main.html', $scope.$config)
        .then(templator.inject.bind(null, $scope.$wrapper));
};

//we cache all the DOM elements we'll use later
var registerDOM = function(){
    $scope.$DOM = {};
    $scope.$DOM.element = $scope.$wrapper.querySelector('.some-element');
};

//we attach the events needed
var registerEvents = function(){
    $scope.$DOM.element.addEventListener('click', clickHandler);
};
```

### sub-modules
in some modules it will make sense to create sub-modules to manage smaller parts of the application.  
for more information on how to create and use sub-modules please refer to https://github.com/albumprinter/oet-nextgen-footer-tabs
