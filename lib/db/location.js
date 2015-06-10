module.exports = function(sequelize, DataTypes) {
  var Location = sequelize.define('location', {
    date : {
      type : DataTypes.DATE,
      allowNull : false,
        validate:{

            notEmpty: true
        }
    },
    lat : {
      type : DataTypes.FLOAT,
      allowNull : false,
        validate:{

            notEmpty: true
        }
    },
    lng : {
      type : DataTypes.FLOAT,
      allowNull : false,
        validate:{

            notEmpty: true
        }
    },
    accuracy : {
        type : DataTypes.FLOAT
    },
    satellites : {
        type : DataTypes.INTEGER
    },
    provider : {
        type : DataTypes.STRING
    },
    bearing : {
        type : DataTypes.FLOAT
    },
    speed : {
        type : DataTypes.FLOAT
    }
  }, {
    tableName: 'locations',
    timestamps : false,
    associate : function(models) {
      Location.belongsTo(models.user);
    }
  });

  return Location;
}
