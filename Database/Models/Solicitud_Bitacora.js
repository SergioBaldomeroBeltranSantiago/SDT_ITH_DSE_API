const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");
const Solicitud = require("./Solicitud");

class Solicitud_Bitacora extends Model {}
Solicitud_Bitacora.init(
  {
    fecha_C: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    estatus_Anterior: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    retroalimentacion: {
      type: DataTypes.STRING,
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
    name: "Solicitud_referente",
    allowNull: false,
  },
});

module.exports = Solicitud_Bitacora;
