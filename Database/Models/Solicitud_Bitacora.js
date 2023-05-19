const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");
const Solicitud = require("./Solicitud");

class Solicitud_Bitacora extends Model {}
Solicitud_Bitacora.init(
  {
    id_Solicitud_Bitacora: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    fecha_Cambio: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    estatus_Anterior: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    retroalimentacion_Anterior: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Solicitudes_Bitacora",
    tableName: "Solicitudes_Bitacora",
    timestamps: false,
  }
);

Solicitud.hasMany(Solicitud_Bitacora, {
  foreignKey: {
    name: "solicitud_Asociada",
    allowNull: false,
  },
});

module.exports = Solicitud_Bitacora;
