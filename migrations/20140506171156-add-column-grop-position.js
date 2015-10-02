module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn("groups", "lat", DataTypes.FLOAT).then(function() {
      migration.addColumn("groups", "lng", DataTypes.FLOAT).then(function() {
        done()
      });
    });
  },
  down: function(migration, DataTypes, done) {
    migration.removeColumn("groups", "lat", DataTypes.FLOAT).then(function() {
      migration.removeColumn("groups", "lng", DataTypes.FLOAT).then(function() {
        done()
      });
    });
  }
}
