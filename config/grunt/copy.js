var fs = require('fs');
var path = require('path');
var grunt = require('grunt');
var globals = require('../globals');
var pkg = grunt.file.readJSON('./package.json');

var modulesViewConfig = { files: [] };

var copy = module.exports = {
    dev: {
        files: [
            {
                expand: true,
                cwd: '<%= config.project.root %>',
                src: ['**/*.html', '!index.html', '!index-prod.html', 'fonts/**/*'],
                dest: '<%= config.target.dev %>'
            },
            {
                expand: true,
                cwd: 'node_modules/bootstrap/dist/',
                src: [
                    '**/*.*'
                ],
                dest: '<%= config.target.dev %>bootstrap'
            }
        ]
    },
    prod: {
        files: [
            {
                expand: true,
                cwd: '<%= config.project.root %>',
                src: ['**/*.html', '!index.html', '!index-prod.html', 'fonts/**/*'],
                dest: '<%= config.target.prod %>'
            },
            {
                expand: true,
                cwd: 'node_modules/bootstrap/dist/',
                src: [
                    '**/*.*'
                ],
                dest: '<%= config.target.prod %>bootstrap'
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

