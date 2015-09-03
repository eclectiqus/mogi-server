/* jslint node: true */
"use strict";

module.exports = function(grunt) {
  grunt.initConfig({
    simplemocha: {
      options: {
        globals: ['should'],
        timeout: 3000,
        ignoreLeaks: false,
        //grep: '*-test',
        ui: 'bdd',
        reporter: 'tap'
      },
      all: { src: ['test/**/*.js'] }
    },
    env : {
      development : {
        NODE_ENV : 'development'
      },
      test : {
        NODE_ENV : 'test'
      },
      production : {
          NODE_ENV : 'production'
      }
    },
    forever : {
      options : {
        index: 'app.js'
      }
    },
    nodemon : {
      dev : {
        options : {
          file :  'app.js'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-env');
  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-forever');

  grunt.registerTask('test', ['env:test','simplemocha']);
  grunt.registerTask('server', ['env:production', 'forever::restart']);
  grunt.registerTask('default', ['env:development', 'nodemon']);
};
