'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    migration.addColumn("videos", "isValid", DataTypes.BOOLEAN_TYPE);
  },

  down: function (queryInterface, Sequelize) {
    migration.removeColumn("videos", "isValid", DataTypes.BOOLEAN_TYPE);
  }
};
