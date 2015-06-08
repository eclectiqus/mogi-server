var pbkdf2 = require("easy-pbkdf2")();

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define('user', {
    id : {
      type : DataTypes.BIGINT,
      primaryKey : true,
      autoIncrement : true
    },
    username : {
      type : DataTypes.STRING,
      allowNull : false,
      validate:{

          notEmpty: true
      },
      unique : true
    },
    passwordHash : {
      type : DataTypes.STRING(1024),
      allowNull : false,
      validate:{

          notEmpty: true
      }
    },
    passwordSalt : {
      type : DataTypes.STRING(1024),
      allowNull : false,
        validate:{

            notEmpty: true
        }
    },
    name : {
      type : DataTypes.STRING,
      allowNull : false,
        validate:{

            notEmpty: true
        }
    },
    profilePicture : {
      type : DataTypes.STRING
    },
    email : {
      type : DataTypes.STRING(255),
      unique : true,
      validate : {
        allowNull : false,
          isEmail : true,
          notEmpty: true
      }
    },
    gcmRegistration : {
      type : DataTypes.STRING(1024)
    },
    isAdmin : {
      type : DataTypes.BOOLEAN,
      defaultValue : false
    },
    lastLat : {
      type : DataTypes.FLOAT
    },
    lastLng : {
      type : DataTypes.FLOAT
    },
    lastLocationUpdateDate : {
      type : DataTypes.DATE
    }
  }, {
    tableName: 'users',
    associate : function(models) {
      User.hasMany(models.accesstoken);
      User.hasMany(models.location);
      User.hasMany(models.video);
      User.hasMany(models.history);
      User.belongsTo(models.group);
    },
    instanceMethods : {
      validatePassword : function(password, done) {
        pbkdf2.verify(this.passwordSalt, this.passwordHash, password, function(err, valid) {
          return done(valid);
        });
      },
      hashPassword : function(password, done) {
        var self = this;
        pbkdf2.secureHash(password, function(err, passwordHash, newSalt) {
          self.passwordHash = passwordHash;
          self.passwordSalt = newSalt;
          done();
        });
      }
    }
  });

return User;
};
