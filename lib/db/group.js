module.exports = function(sequelize, DataTypes) {
  var Group = sequelize.define('group', {
    id : {
      type : DataTypes.INTEGER,
      primaryKey : true,
      autoIncrement : true
    },
    name : {
      type : DataTypes.STRING(255),
      allowNull : false,
      unique : true
    },
    isAdmin : {
        type : DataTypes.BOOLEAN
    },
    lat : {
          type : DataTypes.FLOAT
    },
    lng : {
          type : DataTypes.FLOAT
    }
  }, {
    tableName: 'groups',
    associate : function(models) {
      Group.hasMany(models.user);
    }
  });

  return Group;
};
