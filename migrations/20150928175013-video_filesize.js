'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
    queryInterface.addColumn("videos", "filesize", Sequelize.INTEGER()).then(function() {
      queryInterface.sequelize.query("UPDATE videos SET filesize = 0").then(function() {
        queryInterface.changeColumn('videos', 'filesize', { type: Sequelize.INTEGER(), allowNull: false, default: 0.0 } ).then(function() {
          done();
        })
      })
    });
  },

  down: function (queryInterface, Sequelize, done) {
    queryInterface.removeColumn("videos", "filesize").then(function() {
      done();
    });
  }
};
