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
      unique : true
    },
    passwordHash : {
      type : DataTypes.STRING(1024),
      allowNull : false
    },
    passwordSalt : {
      type : DataTypes.STRING(1024),
      allowNull : false
    },
    name : {
      type : DataTypes.STRING,
      allowNull : false
    },
    profilePicture : {
      type : DataTypes.STRING
    },
    email : {
      type : DataTypes.STRING(255),
      unique : true,
      allowNull : false,
      validate : {
          isEmail : true
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
    },
    language : {
      type : DataTypes.STRING(5)
    }

  }, {
    tableName: 'users',
    timestamps : false,
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
          console.log("pass=" + passwordHash);
          console.log("salt=" + newSalt);
          self.passwordHash = passwordHash;
          self.passwordSalt = newSalt;
          done();
        });
      }
    }
  });

return User;
};
