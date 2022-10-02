const { Model, DataTypes } = require("sequelize");
const { maximumLength } = require("tedious/lib/data-types/varchar");
const sequelize = require("../db");

class Tramite_M extends Model {}
Tramite_M.init(
    {
    id_TM: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    imagen: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    texto: {
        type: DataTypes.STRING(maximumLength),
        allowNull: false
    },
    tipo: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    orden: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
    },
    { sequelize, modelName: "Tramite_M", tableName: "Tramite_M", timestamps: false }
);

module.exports = Tramite_M;