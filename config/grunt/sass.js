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
