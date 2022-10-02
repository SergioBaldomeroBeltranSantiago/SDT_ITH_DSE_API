const { Model, DataTypes } = require("sequelize");
const { maximumLength } = require("tedious/lib/data-types/varchar");
const sequelize = require("../db");

class Solicitudes_Bitacora extends Model {}
Solicitudes_Bitacora.init(
    {
        solicitud_Ref: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    fecha_C: {
        type: DataTypes.DATE,
        allowNull: false
    },
    estatus_Anterior: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    retroalimentacion: {
        type: DataTypes.STRING(maximumLength),
        allowNull: false
    }
    },
    { sequelize, modelName: "Solicitudes_Bitacora", tableName: "Solicitudes_Bitacora", timestamps: false }
);

module.exports = Solicitudes_Bitacora;