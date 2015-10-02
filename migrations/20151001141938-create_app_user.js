'use strict';
var copcast_db_user = require('../lib/db').sequelize.config.username;
var copcast_db_pass = require('../lib/db').sequelize.config.password;

module.exports = {
  up: function (queryInterface, Sequelize, done) {
    queryInterface.sequelize.query("CREATE USER "+copcast_db_user+" WITH password :pass", { replacements: {pass: copcast_db_pass}}).then(function() {
      queryInterface.sequelize.query("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT,INSERT ON TABLES TO "+copcast_db_user).then(function() {
        queryInterface.sequelize.query("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO "+copcast_db_user).then(function() {
          queryInterface.sequelize.query("GRANT SELECT,INSERT ON ALL TABLES IN SCHEMA public TO "+copcast_db_user).then(function() {
            queryInterface.sequelize.query("GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO "+copcast_db_user).then(function() {
              done();
            });
          });
        });
      });
    });
  },

  down: function (queryInterface, Sequelize, done) {

    queryInterface.sequelize.query("ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE SELECT,INSERT ON TABLES FROM "+copcast_db_user).then(function() {
      queryInterface.sequelize.query("ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE SELECT ON SEQUENCES FROM "+copcast_db_user).then(function() {
        queryInterface.sequelize.query("REVOKE SELECT,INSERT ON ALL TABLES IN SCHEMA public FROM "+copcast_db_user).then(function() {
          queryInterface.sequelize.query("REVOKE SELECT ON ALL SEQUENCES IN SCHEMA public FROM "+copcast_db_user).then(function() {
            queryInterface.sequelize.query("DROP USER "+copcast_db_user).then(function() {
              done();
            });
          });
        });
      });
    });
  }
};
