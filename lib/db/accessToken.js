var uuid = require('node-uuid');

module.exports = function(sequelize, DataTypes) {
  var AccessToken = sequelize.define('accesstoken', {
    id : {
        type : DataTypes.UUID,
        defaultValue : uuid.v4(),
        primaryKey : true
    },
    scope : {
      type : DataTypes.STRING(255),
      allowNull : false
        },
      expirationDate : {
        type : DataTypes.DATE,
        allowNull : true,
        validate:{

            notEmpty: true
        }
    }
  }, {
    tableName: 'access_tokens',
    associate : function(models) {
      AccessToken.belongsTo(models.user);
    }
  });

  return AccessToken;
}
