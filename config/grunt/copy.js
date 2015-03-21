var fs = require('fs');
var path = require('path');
var grunt = require('grunt');
var globals = require('../globals');
var pkg = grunt.file.readJSON('./package.json');

var modulesViewConfig = { files: [] };

module.exports = {
    html: {
        files: [
            {
                expand: true,
                cwd: '<%= config.project.root %>',
                src: ['**/*.html', 'index.html'],
                dest: '<%= config.target.dev %>'
            }
        ]
    },
    styles: {
        files: [
            {
                expand: true,
                cwd: 'node_modules/oet-editor-styles/',
                src: [
                    '**/*.*',
                    '!**/*.scss',
                    '!css/',
                    '!node_modules/'
                ], 
                dest: '<%= config.target.dev %>'
            }, 
            {
                expand: true,
                cwd: 'node_modules/oet-editor-styles/css/',
                src: [
                    '**/*.*',
                    '!**/*.scss'
                ], 
                dest: '<%= config.target.dev %>'
            }
        ]
    }, 
    modulesViews: modulesViewConfig
};

(function createModulesViewsCopyTask(){
    var modules = Object.keys(pkg.devDependencies).forEach(function(dependency){
        if(dependency.indexOf('oet') === -1){ return; };

        var viewsPath = path.join('node_modules', dependency, 'src', 'views');
        if( !fs.existsSync(viewsPath) ) { return; }
        modulesViewConfig.files.push({
            expand: true,
            cwd: viewsPath,
            src: ['**/*.html'],
            dest: 'dist/dev/views/'
        });
    });
})();

module.exports.bootstrap = {
    expand: true,
    cwd: 'node_modules/bootstrap/dist/',
    src: [
        '**/*.*'
    ], 
    dest: '<%= config.target.dev %>/bootstrap'
}
