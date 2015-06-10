module.exports = function(sequelize, DataTypes) {
    var History = sequelize.define('history', {
        previousState : {
            type : DataTypes.STRING,
            allowNull : false,
            validate:{
                notEmpty: true
            }
        },
        nextState : {
            type : DataTypes.STRING,
            allowNull : false,
            validate:{

                notEmpty: true
            }
        },
        date: {
            type : DataTypes.DATE
        }

    }, {
        tableName: 'histories',
        timestamps : true,
        associate : function(models) {
            History.belongsTo(models.user);
        }
    });

    return History;
}
