var fs = require('fs');
var path = require('path');
var grunt = require('grunt');
var globals = require('../globals');
var pkg = grunt.file.readJSON('./package.json');

module.exports = {
    dev: {
        options: {
          trace: true,
          sourcemap: 'inline',
          style: 'expanded',
          unixNewlines: true
        },
        files: {
            '<%= config.target.dev %><%= pkg.name %>.css': '<%= config.project.root %>layout.scss'
        }
    }, 
    prod: {
        options: {
          trace: false,
          sourcemap: 'none',
          style: 'compressed',
          unixNewlines: true
        },
        files: {
            '<%= config.target.prod %><%= pkg.name %>.min.css': '<%= config.project.root %>layout.scss'
        }
    }
};
