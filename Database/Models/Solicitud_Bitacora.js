const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");

class Solicitud_Bitacora extends Model {}
Solicitud_Bitacora.init(
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
        type: DataTypes.STRING,
        allowNull: false
    }
    },
    { sequelize, modelName: "Solicitudes_Bitacora", tableName: "Solicitudes_Bitacora", timestamps: false }
);

module.exports = Solicitud_Bitacora;