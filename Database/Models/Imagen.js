const { Model, DataTypes } = require("sequelize");
const { maximumLength } = require("tedious/lib/data-types/varbinary");
const sequelize = require("../db");

class Imagen extends Model {}
Imagen.init(
    {
    id_I: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true,
    },
    nombre_I: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    Imagen_Data: {
        type: DataTypes.STRING(maximumLength),
        allowNull: false
    }
    },
    { sequelize, modelName: "Imagen", tableName: "Imagen", timestamps: false }
);

module.exports = Imagen;
