var uuid = require('node-uuid');

module.exports = function(sequelize, DataTypes) {
  var Video = sequelize.define('Video', {
    id : {
      type : DataTypes.UUID,
      defaultValue : uuid.v4(),
      primaryKey : true
    },
    date : {
      type : DataTypes.DATE,
        validate:{
            notNull : true,
            notEmpty: true
        }
    },
    duration : {
      type : DataTypes.INTEGER,
        validate:{
            notNull : true,
            notEmpty: true
        }
    }
  }, {
    tableName: 'videos',
    timestamps : false,
    associate : function(models) {
      Video.belongsTo(models.User);
    },
    instanceMethods : {
      videoPath : function() {
        return this.userId + '/' + this.id + '.mp4';
      },
      audioPath : function() {
         return this.userId + '/' + this.id + '.m4a';
      }
    }
  });

  return Video;
}