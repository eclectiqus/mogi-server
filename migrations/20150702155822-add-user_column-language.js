'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
    queryInterface.addColumn("users", "language", Sequelize.STRING(5)).then(function() {
      done();
    });
  },

  down: function (queryInterface, Sequelize, done) {
    queryInterface.removeColumn("users", "language").then(function() {
      done();
    });
  }
};
