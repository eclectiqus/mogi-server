'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
    queryInterface.addColumn("videos", "filesize", Sequelize.INTEGER());
    queryInterface.sequelize.query("UPDATE videos SET filesize = 0");
    queryInterface.changeColumn('videos', 'filesize', { type: Sequelize.INTEGER(), allowNull: false, default: 0.0 } );
    done();
  },

  down: function (queryInterface, Sequelize, done) {
    queryInterface.removeColumn("videos", "filesize");
    done();
  }
};
