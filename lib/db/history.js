module.exports = function(sequelize, DataTypes) {
    var History = sequelize.define('history', {
        previousState : {
            type : DataTypes.STRING,
            allowNull : false
        },
        nextState : {
            type : DataTypes.STRING,
            allowNull : false
        },
        date: {
            type : DataTypes.DATE
        }

    }, {
        tableName: 'histories',
        timestamps : false,
        associate : function(models) {
            History.belongsTo(models.user);
        }
    });

    return History;
}
