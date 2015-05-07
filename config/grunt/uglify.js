module.exports = {
    options: {
      compress: {
        drop_console: true
      }
    },
    prod: {
      files: {
        '<%= config.target.prod %><%= pkg.name %>.min.js': ['<%= config.target.dev %><%= pkg.name %>.js']
      }
    }
  };