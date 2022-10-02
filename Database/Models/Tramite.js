const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");

class Tramite extends Model {}
Tramite.init(
    {
    id_T: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true,
    },
    nombre_T: {
        type: DataTypes.STRING(20),
        allowNull: false
    }
    },
    { sequelize, modelName: "Tramite", tableName: "Tramites", timestamps: false }
);

module.exports = Tramite;
