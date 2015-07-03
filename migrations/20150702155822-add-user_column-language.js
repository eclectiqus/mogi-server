'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.addColumn("users", "language", Sequelize.STRING(5));
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.removeColumn("users", "language");
  }
};
