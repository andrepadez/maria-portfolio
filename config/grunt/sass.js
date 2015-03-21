var fs = require('fs');
var path = require('path');
var grunt = require('grunt');
var globals = require('../globals');
var pkg = grunt.file.readJSON('./package.json');

module.exports = {
    // development mode
    dev: {
        options: {
            style: 'expanded'
        },
        files: {
            '<%= config.target.dev %><%= pkg.name %>.css': '<%= config.project.root %>layout.scss'
        }
    }
};

(function writeScssDependencies(){
    var includesSCSS = [
        '@charset "UTF-8";', 
        // '@import "../node_modules/oet-editor-styles/css/layout.scss";',
        '@import "./css/main.scss";'
    ];
    var modules = Object.keys(pkg.devDependencies).forEach(function(dependency){
        if(dependency.indexOf('oet') === -1){ return; };
        var scssPath = 'node_modules/' + dependency + '/src/css/main.scss';
        if( !fs.existsSync(scssPath) ) { return; }
        includesSCSS.push( '@import "'+scssPath+'";' );
    });
    includesSCSS.push('@import "./css/main.scss";');
    fs.writeFileSync(globals.config.project.root+'layout.scss', includesSCSS.join('\n'), {encoding: 'utf8'});
})();
