module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn("locations", "accuracy", DataTypes.FLOAT).then(function() {
      migration.addColumn("locations", "satellites", DataTypes.INTEGER).then(function() {
        migration.addColumn("locations", "provider", DataTypes.STRING).then(function() {
          migration.addColumn("locations", "bearing", DataTypes.FLOAT).then(function() {
            migration.addColumn("locations", "speed", DataTypes.FLOAT).then(function() {
              done();
            });
          });
        });
      });
    });
  },
  down: function(migration, DataTypes, done) {
    migration.removeColumn("locations", "accuracy", DataTypes.FLOAT).then(function() {
      migration.removeColumn("locations", "satellites", DataTypes.INTEGER).then(function() {
        migration.removeColumn("locations", "provider", DataTypes.STRING).then(function() {
          migration.removeColumn("locations", "bearing", DataTypes.FLOAT).then(function() {
            migration.removeColumn("locations", "speed", DataTypes.FLOAT).then(function() {
              done();
            })
          })
        })
      })
    });
  }
}
