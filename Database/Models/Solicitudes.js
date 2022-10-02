const { Model, DataTypes } = require("sequelize");
const { maximumLength } = require("tedious/lib/data-types/varchar");
const sequelize = require("../db");

class Solicitudes extends Model {}
Solicitudes.init(
    {
    id_S: {
        type: DataTypes.STRING(10),
        primaryKey: true,
        allowNull: false
    },
    estudiante: {
        type: DataTypes.STRING(9),
        allowNull: false
    },
    tramite: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    fecha_Sol: {
        type: DataTypes.DATE,
        allowNull: false
    },
    fecha_Act: {
        type: DataTypes.DATE,
        allowNull: false
    },
    estatus: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    retroalimentacion: {
        type: DataTypes.STRING(maximumLength),
        allowNull: false
    }
    },
    { sequelize, modelName: "Solicitudes", tableName: "Solicitudes", timestamps: false }
);

module.exports = Solicitudes;