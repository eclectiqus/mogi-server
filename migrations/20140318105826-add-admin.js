module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn("groups", "isAdmin", DataTypes.BOOLEAN).then(function() {
      done()
    });
  },
  down: function(migration, DataTypes, done) {
      migration.removeColumn("groups", "isAdmin").then(function() {
        done()
      });
  }
}
