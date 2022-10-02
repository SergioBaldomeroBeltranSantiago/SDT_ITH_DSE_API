const { Model, DataTypes } = require("sequelize");
const { maximumLength } = require("tedious/lib/data-types/varbinary");
const sequelize = require("../db");

class Documentos extends Model {}
Documentos.init(
    {
    solicitud: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true,
    },
    nombre_D: {
        type: DataTypes.STRING(40),
        allowNull: false
    },
    documento_Data: {
        type: DataTypes.STRING(maximumLength),
        allowNull: false
    }
    },
    { sequelize, modelName: "Documentos", tableName: "Documentos", timestamps: false }
);

module.exports = Documentos;
