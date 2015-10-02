module.exports = {
  up: function(migration, DataTypes, done) {
      migration.createTable(
          'histories',
          {
              id: {
                  type: DataTypes.INTEGER,
                  primaryKey: true,
                  autoIncrement: true
              },
              createdAt: {
                  type: DataTypes.DATE
              },
              updatedAt: {
                  type: DataTypes.DATE
              },
              previousState: DataTypes.STRING,
              nextState: DataTypes.STRING,
              userId: DataTypes.BIGINT
          },
          {}
      ).then(function() {
          done();
        });
  },
  down: function(migration, DataTypes, done) {
    migration.dropTable('histories').then(function(){
      done();
    });
  }
}
