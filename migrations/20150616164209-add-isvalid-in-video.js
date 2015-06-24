'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    queryInterface.addColumn("videos", "isValid", DataTypes.BOOLEAN);
  },

  down: function (queryInterface, DataTypes) {
    queryInterface.removeColumn("videos", "isValid");
  }
};
