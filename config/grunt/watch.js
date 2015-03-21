module.exports = {
    js: {
        files: '<%= config.project.root %>**/*.js',
        tasks: ['browserify:dev']
    },
    css: {
        files: '<%= config.project.root %>**/*.scss',
        tasks: ['sass:dev']
    },
    html: {
        files: '<%= config.project.root %>**/*.html',
        tasks: ['copy:html', 'replace:dev']
    }
};
