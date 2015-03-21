var fs = require('fs');
var path = require('path');

var config = module.exports = {
    config: {
        // where the development takes place
        project: {
            root: 'src/'
        },

        // production build output folders
        target: { 
            dev   : 'dist/dev/'
        }
    }
};
var modulePath = path.join(__dirname, './grunt'); 

fs.readdirSync(modulePath).forEach(function(file){
    config[file.slice(0, -3)] = require(path.join(modulePath, file));
});

