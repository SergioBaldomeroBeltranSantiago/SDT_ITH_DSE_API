const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");
const Solicitud = require("./Solicitud");

class Documento extends Model {}
Documento.init(
  {
    id_Documento: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre_Documento: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    ruta_Documento: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Documento",
    tableName: "Documentos",
    timestamps: false,
  }
);

Solicitud.hasMany(Documento, {
  foreignKey: {
    name: "solicitud_Vinculada",
    allowNull: false,
  },
});

module.exports = Documento;
