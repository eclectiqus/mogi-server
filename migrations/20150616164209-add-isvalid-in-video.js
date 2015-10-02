'use strict';

module.exports = {
  up: function (queryInterface, DataTypes, done) {
    queryInterface.addColumn("videos", "isValid", DataTypes.BOOLEAN).then(function() {
      done();
    });
  },

  down: function (queryInterface, DataTypes, done) {
    queryInterface.removeColumn("videos", "isValid").then(function() {
      done();
    });
  }
};
