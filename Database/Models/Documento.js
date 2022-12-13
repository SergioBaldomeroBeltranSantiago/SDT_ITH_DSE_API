const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");
const Solicitud = require("./Solicitud");

class Documento extends Model {}
Documento.init(
  {
    id_Doc: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre_Doc: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    archivo_Doc: {
      type: DataTypes.BLOB,
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
