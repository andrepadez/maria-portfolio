module.exports = {
  dynamic: {                         // Another target
    files: [{
      expand: true,                  // Enable dynamic expansion
      cwd: 'images/',                   // Src matches are relative to this path
      src: ['**/*.{png,jpg,gif}'],   // Actual patterns to match
      dest: 'dist/dev/images'        // Destination path prefix
    }]
  }
};